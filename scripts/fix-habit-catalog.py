"""Jednorazowa korekta katalogu habitów (ikony, nazwy wyświetlane, kategorie).

Pole `name` jest kluczem zapisywanym w Firestore — NIE zmieniamy go,
poprawiamy tylko `icon`, `display_name` i `category`.
"""
import json
import pathlib

PATH = pathlib.Path(__file__).resolve().parent.parent / "src/assets/habbitList.json"

# name -> (icon | None, display_name | None)
FIXES = {
    # Fitness & sport
    "Trail running": ("sprint", None),
    "Calisthenics": ("exercise", None),
    "Pilates": ("accessibility", None),
    "Rock climbing": ("mountain_flag", None),
    "Archery": ("target", None),
    "Snowboarding": ("snowboarding", "Snowboarding"),
    "Kitesurfing": ("kitesurfing", None),
    "Snorkeling": ("scuba_diving", None),
    "Mountain biking": (None, "Mountain biking"),
    "Cross-country skiing": ("nordic_walking", "Cross-country ski"),
    "Skateboarding": (None, "Skateboarding"),
    "Paddleboarding": (None, "Paddleboarding"),
    "Roller skating": (None, "Roller skating"),
    # Jedzenie
    "Try new recipe": ("cooking", None),
    "Take vitamins": ("pill", None),
    "Mindful eating": ("rice_bowl", None),
    # Sen i rytuały
    "Wake up early": (None, "Wake up early"),
    "Go to bed early": ("bedtime", "Early bedtime"),
    "Morning routine": ("routine", None),
    "Evening routine": ("moon_stars", None),
    "No phone before bed": ("mobile_cancel", "No phone in bed"),
    "Get sunlight": ("sunny", None),
    "Make the bed": ("king_bed", None),
    # Głowa
    "Practice mindfulness": ("filter_vintage", None),
    "Positive self-talk": (None, "Positive self-talk"),
    "Relaxation time": ("weekend", "Relax"),
    "Ask for help": (None, "Ask for help"),
    "Play a brain training game": ("neurology", None),
    "Set an intention for the day": ("flag", None),
    "Reflect on today's wins": ("trophy", None),
    # Nauka
    "Read a book": ("menu_book", "Read a book"),
    "Take a class": (None, "Take a class"),
    "Watch documentary": (None, "Documentary"),
    "Practice public speaking": (None, "Public speaking"),
    "Watch an educational video": (None, "Learning video"),
    # Praca
    "Review progress": (None, "Review progress"),
    "Complete a task": (None, "Complete a task"),
    "Finish a project": (None, "Finish a project"),
    "Limit notifications": ("notifications_off", None),
    "Organize documents": (None, "Organize docs"),
    "Take a screen break": ("desktop_access_disabled", None),
    "Time blocking": (None, "Time blocking"),
    "Walking meeting": (None, "Walking meeting"),
    "Mentor someone": ("co_present", None),
    "Limit screen time": ("mobile_lock_portrait", "Limit screen time"),
    # Finanse
    "Track expenses": (None, "Track expenses"),
    # Dom
    "Fix something": (None, "Fix something"),
    "Organize closet": (None, "Organize closet"),
    "Change bedsheets": ("bedroom_parent", None),
    "Clean the coffee maker": (None, "Clean coffee maker"),
    # Zwierzęta
    "Feed the dog": ("sound_detection_dog_barking", None),
    "Play with pet": (None, "Play with pet"),
    "Pick up after the dog": (None, "Pick up after dog"),
    # Higiena
    "Brush teeth": ("dentistry", None),
    "Floss teeth": ("gesture", None),
    "Apply sunscreen": ("beach_access", None),
    "Apply moisturizer": ("soap", None),
    "Shave": ("face_6", None),
    "Hair care routine": ("face_3", None),
    "Face massage": ("face_4", None),
    "Dress up nicely": ("apparel", None),
    # Transport
    "Refuel the car": (None, "Refuel car"),
    # Rodzina i ludzie
    "Play with children": (None, "Play with kids"),
    "Prepare kids' lunch": (None, "Kids' lunch"),
    "Praise or encourage a child": ("sentiment_very_satisfied", None),
    "Random act of kindness": ("volunteer_activism", None),
    "Compliment someone": ("mood", None),
    "Attend an event": (None, "Attend an event"),
    # Hobby
    "Photography": (None, "Photography"),
    "Knitting or crochet": ("styler", None),
    "Try a new hobby": ("interests", None),
    # Natura i podróże
    "Visit a park": (None, "Visit a park"),
    "Watch the sunset": (None, "Watch the sunset"),
    "Stargazing": ("moon_stars", None),
    "Explore a new neighborhood": (None, "Explore nearby"),
    # Cyfrowe
    "Unplug for an hour": ("mobile_off", "Unplug for an hour"),
    "Update apps and software": ("system_update_alt", None),
    "Update passwords": (None, "Update passwords"),
    "Organize digital files": (None, "Organize files"),
    "Organize photos": (None, "Organize photos"),
    # Regeneracja
    "Cold shower": ("severe_cold", None),
    "Warm up before exercise": ("local_fire_department", None),
    "Cool down after exercise": ("ac_unit", None),
    "Take a sauna": ("sauna", None),
    "Foam rolling": (None, "Foam rolling"),
    "Prayer or spiritual practice": ("folded_hands", None),
    # Złe nawyki — pełne, czytelne nazwy zamiast skrótów
    "procrastinating important tasks": (None, "Procrastinating"),
    "browsing social media endlessly": ("mobile", "Endless scrolling"),
    "eating junk food late at night": (None, "Late-night junk food"),
    "starting the day without a plan": (None, "No plan for the day"),
    "doomscrolling social media": (None, "Doomscrolling"),
    "snacking out of boredom": (None, "Boredom snacking"),
    "avoiding difficult tasks": (None, "Avoiding tasks"),
    "sitting for hours without a break": (None, "Sitting for hours"),
    "skipping workouts regularly": (None, "Skipping workouts"),
    "working until burnout": (None, "Overworking"),
    "eating fast food several times a week": (None, "Fast food"),
    "watching series all night": (None, "Binge-watching"),
    "checking phone first thing in the morning": ("mobile_alert", "Phone first thing"),
    "leaving tasks to the last minute": (None, "Last-minute rush"),
    "skipping breakfast": (None, "Skipping breakfast"),
    "overeating out of emotion": (None, "Emotional eating"),
    "sleeping until noon": (None, "Sleeping in"),
    "ignoring to-do list": (None, "Ignoring to-dos"),
    "impulse buying": (None, "Impulse buying"),
    "comparing yourself on social media": (None, "Comparing online"),
    "drinking alcohol": (None, "Drinking alcohol"),
    "excessive screen time": ("mobile_dots", "Too much screen time"),
    "texting while driving": ("car_crash", "Texting & driving"),
    "online impulse shopping": (None, "Online impulse buys"),
    "skipping breaks": ("timer_off", "Skipping breaks"),
    "checking email obsessively": (None, "Checking email"),
    "missing deadlines": (None, "Missed deadline"),
    "overcommitting to tasks": (None, "Overcommitting"),
    "ignoring pain or injury": (None, "Ignoring pain"),
    "avoiding difficult conversations": (None, "Avoiding hard talks"),
    "canceling plans last minute": (None, "Cancelling plans"),
    "ignoring bills": (None, "Ignoring bills"),
    "suppressing your feelings": (None, "Bottling feelings"),
}

# Używki nie pasują do "Nutrition & Food"
RECATEGORIZE = {
    "Avoid alcohol": "Health Monitoring",
    "Avoid smoking": "Health Monitoring",
    "smoking cigarettes": "Health Monitoring",
    "vaping": "Health Monitoring",
    "drinking alcohol": "Health Monitoring",
    "recreational drug use": "Health Monitoring",
}

data = json.loads(PATH.read_text(encoding="utf-8"))
names = {h["name"] for h in data}
unknown = (set(FIXES) | set(RECATEGORIZE)) - names
assert not unknown, f"Nieznane nazwy: {unknown}"

for h in data:
    icon, display = FIXES.get(h["name"], (None, None))
    if icon:
        h["icon"] = icon
    if display:
        h["display_name"] = display
    if h["name"] in RECATEGORIZE:
        h["category"] = RECATEGORIZE[h["name"]]

PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Poprawiono {len(FIXES)} habitów, przeniesiono {len(RECATEGORIZE)}")
