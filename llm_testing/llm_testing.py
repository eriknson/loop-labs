# pip install openai
from openai import OpenAI
import json
import os

"""
SIMPLE MORNING BRIEF GENERATOR
=============================

One GPT-5 call that:
1. Takes persona+calendar.json as input
2. Uses web search to find relevant information
3. Outputs Google Calendar JSON format
"""

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

system_prompt = """
You are Loop’s Digest Engine. Create a concise, practical morning brief that feels live and link-rich.

## What you must do
# 1) Search the web for every section (news, local events, weather). Prefer reputable sources; avoid paywalled links.
# 2) Ground everything in the persona & location provided. If a result isn’t relevant to the persona, skip it.
# 3) Always include a direct link after each bullet. Use the site name in brackets, like: (MIT Tech Review).
# 4) Be time-aware. Use the provided timezone; show “time-ago” (e.g., 2h ago) when you can infer publish time.
# 5) Use the calendar context: fill suggestions into today’s free windows; keep reminders to the next 7 days only.
# 6) Be brief and useful: max ~220–280 words. No code fences. Markdown only that renders cleanly in Google Calendar descriptions.

## Output format (exactly)
Good morning {{name}}! Your Loop for {{date_local}}
📍 Weather — {{city}}: {{summary}}, H {{high}} / L {{low}}. Chance of rain: {{pop}}.
📰 News that matters to you
- Headline — one-sentence why it matters. (Source, time-ago) → link
🎟️ This week
- Event · time — venue/neighborhood · price or “free”. (Source) → link
🎯 Suggestions for your free slots
- {{HH:MM–HH:MM}}: suggestion tied to interests/venues (brief why). → link
## Search & ranking rules
- Recency first (≤48h for news; ≤14d for events).
- Relevance scoring: +2 if headline matches role keywords; +1 if source is high-trust; −2 if listicle/SEO farm.
- De-dupe near-identical stories; keep the clearest source.
- If data is uncertain, omit rather than guess.
## Style
- Friendly, crisp, opinionated. Cut fluff; tell why each item matters to this persona.
- Use 2–3 news bullets, 2–3 events, 2–3 suggestions, 2–4 reminders.
- Links: put ONE link per bullet at the end with an arrow → and no UTM params.
If any section cannot be verified with at least one reputable source, write “(No strong updates today)” for that section."
"""

user_prompt_backup = """
Run a morning brief.

now_iso: 2025-09-27T06:30:00Z
timezone: Europe/Lisbon
name: Erik

location:
    city: Lisbon
    country: Portugal
   
persona:
    A professional in design, based in Lisbon, Portugal. Typically starts the day at 09:30 and ends by 17:30, 
    with quiet hours from 23:00 to 08:00. Frequently collaborates with Johan from Freym and team members from Yeet. 
    Interests include design, tech meetups, and social events. Regularly visits AIhub and IDEA Spaces.

interests_keywords: ["design","UX","AI","tech meetups","Lisbon events"]

typical_day:
 start_local: 09:30
 end_local: 17:30
 quiet_hours: 23:00–08:00
 calendar_context:
 free_windows_today: ["12:30-14:00","18:30-20:00"]
 upcoming_7d:
  - {date:"2025-09-29", title:"Freym sync w/ Johan", location:"IDEA Spaces"}
  - {date:"2025-10-01", title:"AIhub meetup", location:"Saldanha"}
 limits:
 max_news: 3
 max_events: 3
 max_suggestions: 3
 max_reminders: 4
 Requirements:
 - Use web search for weather, news, and events in/near the location.
 - Favor venues or communities mentioned in persona when relevant.
 - Return EXACTLY the markdown format specified in the system prompt.
 - Keep total under 280 words so it fits a Google Calendar event description."
"""

def load_data(file_path: str) -> dict:
    """Load persona and calendar data from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading data: {e}")
        return {}

def generate_user_prompt(data: dict) -> str:
    """Generate user prompt from the data."""
    persona = data.get('persona', {})
    calendar = data.get('calendar', {})
    limits = data.get('limits', {})
    now_iso = data.get('now_iso', '2025-09-27T06:30:00Z')
    
    # Extract persona data
    name = persona.get('name', 'Erik')
    timezone = persona.get('timezone', 'Europe/Lisbon')
    city = persona.get('city', 'Lisbon')
    country = persona.get('country', 'Portugal')
    description = persona.get('description', 'A professional in design')
    interests_keywords = persona.get('interests_keywords', ['design', 'UX', 'AI'])
    typical_day = persona.get('typical_day', {})
    
    # Extract calendar data
    free_windows_today = calendar.get('free_windows_today', ['12:30-14:00', '18:30-20:00'])
    upcoming_7d = calendar.get('upcoming_7d', [])
    
    # Extract limits
    max_news = limits.get('max_news', 3)
    max_events = limits.get('max_events', 3)
    max_suggestions = limits.get('max_suggestions', 3)
    max_reminders = limits.get('max_reminders', 4)
    
    # Format upcoming events
    upcoming_events_str = ""
    for event in upcoming_7d:
        upcoming_events_str += f'   - {{date:"{event["date"]}", title:"{event["title"]}", location:"{event["location"]}"}}\n'
    
    # Format free windows
    free_windows_str = '["' + '","'.join(free_windows_today) + '"]'
    
    # Format interests keywords
    interests_str = '["' + '","'.join(interests_keywords) + '"]'
    
    # Generate the user prompt
    user_prompt = f"""Run a morning brief.

now_iso: {now_iso}
timezone: {timezone}
name: {name}

location:
    city: {city}
    country: {country}
   
persona:
    {description}

interests_keywords: {interests_str}

typical_day:
 start_local: {typical_day.get('start_local', '09:30')}
 end_local: {typical_day.get('end_local', '17:30')}
 quiet_hours: {typical_day.get('quiet_hours', '23:00–08:00')}
 calendar_context:
 free_windows_today: {free_windows_str}
 upcoming_7d:
{upcoming_events_str} limits:
 max_news: {max_news}
 max_events: {max_events}
 max_suggestions: {max_suggestions}
 max_reminders: {max_reminders}
 Requirements:
 - Use web search for weather, news, and events in/near the location.
 - Favor venues or communities mentioned in persona when relevant.
 - Return EXACTLY the markdown format specified in the system prompt.
 - Keep total under 280 words so it fits a Google Calendar event description."""
    
    return user_prompt

def convert_markdown_to_calendar_event(markdown_content: str, data: dict) -> dict:
    """Convert the markdown brief to Google Calendar event format."""
    from datetime import datetime, timedelta
    
    # Debug: Print what we received
    print(f"📄 Received content type: {type(markdown_content)}")
    print(f"📄 Content preview: {str(markdown_content)[:200]}...")
    
    # Get user timezone from persona data
    timezone = data.get('persona', {}).get('timezone')
    
    # Create start and end times (1 hour duration)
    now = datetime.now()
    start_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(hours=1)
    
    # Format times for the timezone
    start_datetime = start_time.strftime("%Y-%m-%dT%H:%M:%S+01:00")
    end_datetime = end_time.strftime("%Y-%m-%dT%H:%M:%S+01:00")
    
    # Clean the content - handle different response types
    if isinstance(markdown_content, str):
        description = markdown_content
    else:
        description = str(markdown_content)
    
    # Create Google Calendar event
    calendar_event = {
        "summary": "Morning Brief ☕️",
        "description": description,
        "start": {
            "dateTime": start_datetime,
            "timeZone": timezone
        },
        "end": {
            "dateTime": end_datetime,
            "timeZone": timezone
        },
        "location": data.get('persona', {}).get('city'),
        "attendees": [
            {
                "email": "contact@eriks.design",
                "responseStatus": "accepted"
            }
        ]
    }
    
    return calendar_event

def generate_morning_brief(data: dict, test: bool = False) -> dict:
    """
    Single GPT-5 call that uses web search and outputs Google Calendar JSON.
    Uses structured output to ensure correct Google Calendar format.
    """
    if data:
        user_prompt = generate_user_prompt(data)
    else:
        user_prompt = user_prompt_backup
        
    try:

        if not test: 
            response = client.responses.create(
                model="gpt-5",
                input=[
                    {
                    "role": "developer",
                    "content": [
                        {
                        "type": "input_text",
                        "text": system_prompt  
                        }
                    ]
                    },
                    {
                    "role": "user",
                    "content": [
                        {
                        "type": "input_text",
                        "text": user_prompt 
                        }
                    ]
                    }
                ],
                text={
                    "format": {
                    "type": "text"
                    },
                    "verbosity": "medium"
                },
                reasoning={
                    "effort": "medium"
                },
                tools=[
                    {
                    "type": "web_search",
                    "user_location": {
                        "type": "approximate"
                    },
                    "search_context_size": "medium"
                    }
                ],
                store=True,
                include=[
                    "reasoning.encrypted_content",
                    "web_search_call.action.sources"
                ]
                )
        else:
            response = client.responses.create(
                model="gpt-5",
                input=[
                    {
                        "role": "developer",
                        "content": [
                            {
                                "type": "input_text",
                                "text": system_prompt
                            }
                        ]
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": user_prompt
                            }
                        ]
                    }
                ],
            )
        
        text_content = response.output_text
        
        # Convert the markdown brief to Google Calendar event format
        calendar_event = convert_markdown_to_calendar_event(text_content, data)
        
        return calendar_event
        
    except Exception as e:
        print(f"Error generating morning brief: {e}")
        
        return None

def main():
    """Main execution function."""
    print("🌅 MORNING BRIEF GENERATOR")
    print("=" * 40)
    
    # Load data
    print("Loading persona+calendar data...")
    data = load_data("persona+calendar.json")
    if not data:
        print("Error: Could not load data")
        return
    
    print(f"Loaded data for {data.get('persona', {}).get('name', 'Unknown')}")
    
    # Generate morning brief
    print("🔍 GPT-5 web search and brief generation...")
    calendar_event = generate_morning_brief(data)
    
    if not calendar_event:
        print("Error: Could not generate morning brief")
        return
            
    # Output the result
    print("\n" + "=" * 60)

    print("✅ GOOGLE CALENDAR EVENT - READY FOR POSTING")

    print("=" * 60)
    
    # Save the markdown content to a file
    description = calendar_event.get("description", "No description")
    with open("description.md", "w", encoding="utf-8") as f:
        f.write(description)
    
    print(f"\n📝 MORNING BRIEF SAVED TO: description.md")
    print(f"📄 Content length: {len(description)} characters")
    
    # Then show the full JSON
    print("\n📅 GOOGLE CALENDAR JSON:")
    print(json.dumps(calendar_event, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()