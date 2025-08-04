import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { formatDate, toDateKey } from "@/utils/timeUtils";
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
	setDoc,
	getDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Goal, UserHabbits, Habbit } from "@/libs/types";
import { nanoid } from "nanoid";

export const useHabbitsStore = defineStore("habbits", () => {
	// Date refs
	const refDate = ref(new Date());
	const dateFormated = computed(() => formatDate(refDate.value));

	// Habbit refs
	const allHabbitsList = ref<Habbit[]>([
		{
			name: "gym",
			icon: "fitness_center",
			severity: "success",
			tags: ["sport", "fitness", "health", "routine"],
		},
		{
			name: "cook",
			icon: "skillet",
			severity: "success",
			tags: ["home", "cooking", "routine", "responsibility"],
		},
		{
			name: "washing",
			icon: "local_laundry_service",
			severity: "success",
			tags: ["home", "cleaning", "responsibility", "routine"],
		},
		{
			name: "vacuum",
			icon: "vacuum",
			severity: "success",
			tags: ["home", "cleaning", "responsibility", "organization"],
		},
		{
			name: "mop",
			icon: "mop",
			severity: "success",
			tags: ["home", "cleaning", "routine", "organization"],
		},
		{
			name: "dishwasher",
			icon: "dishwasher",
			severity: "success",
			tags: ["home", "cleaning", "routine", "responsibility"],
		},
		{
			name: "Meet",
			icon: "groups",
			severity: "success",
			tags: ["social", "relationships", "connection", "community"],
		},
		{
			name: "Learn",
			icon: "school",
			severity: "success",
			tags: ["learning", "growth", "education", "knowledge"],
		},
		{
			name: "shop",
			icon: "shopping_cart",
			severity: "success",
			tags: ["home", "responsibility", "preparedness"],
		},
		{
			name: "bike",
			icon: "pedal_bike",
			severity: "success",
			tags: ["sport", "health", "outdoors", "movement"],
		},
		{
			name: "refuel the car",
			icon: "local_gas_station",
			severity: "success",
			tags: ["home", "maintenance", "responsibility", "routine"],
		},
		{
			name: "wash the car",
			icon: "local_car_wash",
			severity: "success",
			tags: ["home", "cleaning", "maintenance", "responsibility"],
		},
		{
			name: "Car repair",
			icon: "car_repair",
			severity: "success",
			tags: ["home", "maintenance", "responsibility", "safety"],
		},
		{
			name: "Self Care",
			icon: "self_care",
			severity: "success",
			tags: ["health", "self-care", "mental health", "wellness"],
		},
		{
			name: "Dentist",
			icon: "dentistry",
			severity: "success",
			tags: ["health", "self-care", "hygiene", "wellness"],
		},
		{
			name: "Gynecology",
			icon: "gynecology",
			severity: "success",
			tags: ["health", "wellness", "self-care", "routine"],
		},
		{
			name: "Stadia Controller",
			icon: "stadia_controller",
			severity: "success",
			tags: ["hobby", "fun", "entertainment", "gaming"],
		},
		{
			name: "Meditation or mindfulness",
			icon: "self_improvement",
			severity: "success",
			tags: ["mental health", "relaxation", "focus", "self-care"],
		},
		{
			name: "Healthy meal",
			icon: "local_dining",
			severity: "success",
			tags: ["nutrition", "health", "food", "meal"],
		},
		{
			name: "Drink tea or coffee",
			icon: "emoji_food_beverage",
			severity: "success",
			tags: ["routine", "relaxation", "morning", "beverage"],
		},
		{
			name: "Read a book",
			icon: "book",
			severity: "success",
			tags: ["education", "relaxation", "self-improvement", "focus"],
		},
		{
			name: "Painting or drawing",
			icon: "brush",
			severity: "success",
			tags: ["creativity", "art", "expression", "relaxation"],
		},
		{
			name: "Swimming",
			icon: "pool",
			severity: "success",
			tags: ["fitness", "health", "fun", "sport"],
		},
		{
			name: "Relaxation time",
			icon: "spa",
			severity: "success",
			tags: ["self-care", "mental health", "calm", "relaxation"],
		},
		{
			name: "Wake up early",
			icon: "alarm",
			severity: "success",
			tags: ["routine", "discipline", "morning", "productivity"],
		},
		{
			name: "Go to bed early",
			icon: "hotel",
			severity: "success",
			tags: ["sleep", "rest", "health", "routine"],
		},
		{
			name: "Reflect on emotions",
			icon: "psychology",
			severity: "success",
			tags: ["mental health", "journaling", "reflection", "awareness"],
		},
		{
			name: "Gardening",
			icon: "yard",
			severity: "success",
			tags: ["outdoors", "nature", "health", "relaxation"],
		},
		{
			name: "Take care of pets",
			icon: "pets",
			severity: "success",
			tags: ["responsibility", "routine", "animals", "care"],
		},
		{
			name: "Sunlight exposure",
			icon: "light_mode",
			severity: "success",
			tags: ["health", "vitamin D", "outdoors", "mood"],
		},
		{
			name: "Evening walk",
			icon: "dark_mode",
			severity: "success",
			tags: ["relaxation", "fitness", "routine", "outdoors"],
		},
		{
			name: "Practice mindfulness",
			icon: "visibility",
			severity: "success",
			tags: ["focus", "calm", "mental health", "clarity"],
		},
		{
			name: "Study",
			icon: "school",
			severity: "success",
			tags: ["education", "discipline", "growth", "focus"],
		},
		{
			name: "Learn coding",
			icon: "code",
			severity: "success",
			tags: ["skills", "learning", "focus", "career"],
		},
		{
			name: "Learn language",
			icon: "language",
			severity: "success",
			tags: ["skills", "communication", "growth", "learning"],
		},
		{
			name: "Play soccer",
			icon: "sports_soccer",
			severity: "success",
			tags: ["sport", "fitness", "fun", "teamwork"],
		},
		{
			name: "Play tennis",
			icon: "sports_tennis",
			severity: "success",
			tags: ["sport", "agility", "health", "fun"],
		},
		{
			name: "Play handball",
			icon: "sports_handball",
			severity: "success",
			tags: ["sport", "fitness", "teamwork", "exercise"],
		},
		{
			name: "Running",
			icon: "run_circle",
			severity: "success",
			tags: ["sport", "endurance", "health", "cardio"],
		},
		{
			name: "Go hiking",
			icon: "hiking",
			severity: "success",
			tags: ["outdoors", "nature", "fitness", "relaxation"],
		},
		{
			name: "Rowing exercise",
			icon: "rowing",
			severity: "success",
			tags: ["fitness", "cardio", "health", "discipline"],
		},
		{
			name: "Sprint training",
			icon: "directions_run",
			severity: "success",
			tags: ["speed", "athletics", "fitness", "training"],
		},
		{
			name: "Walking",
			icon: "directions_walk",
			severity: "success",
			tags: ["fitness", "health", "routine", "outdoors"],
		},
		{
			name: "Climb stairs",
			icon: "stairs",
			severity: "success",
			tags: ["fitness", "routine", "cardio", "discipline"],
		},
		{
			name: "Evening routine",
			icon: "bedtime",
			severity: "success",
			tags: ["sleep", "routine", "calm", "mental health"],
		},
		{
			name: "Make coffee",
			icon: "coffee",
			severity: "success",
			tags: ["morning", "routine", "focus", "comfort"],
		},
		{
			name: "House cleaning",
			icon: "cleaning_services",
			severity: "success",
			tags: ["organization", "productivity", "routine", "discipline"],
		},
		{
			name: "Do laundry",
			icon: "laundry",
			severity: "success",
			tags: ["routine", "chores", "cleanliness", "home"],
		},
		{
			name: "Manage budget",
			icon: "credit_card",
			severity: "success",
			tags: ["finance", "responsibility", "planning", "discipline"],
		},
		{
			name: "Track heart rate",
			icon: "monitor_heart",
			severity: "success",
			tags: ["health", "monitoring", "fitness", "technology"],
		},
		{
			name: "Donate blood",
			icon: "bloodtype",
			severity: "success",
			tags: ["health", "help", "charity", "community"],
		},
		{
			name: "Express gratitude",
			icon: "favorite",
			severity: "success",
			tags: ["mental health", "self-care", "relationships", "happiness"],
		},
		{
			icon: "volunteer_activism",
			name: "Volunteer work",
			severity: "success",
			tags: ["help", "community", "charity", "purpose"],
		},
		{
			name: "Meaningful conversation",
			icon: "forum",
			severity: "success",
			tags: ["connection", "social", "mental health", "relationships"],
		},
		{
			name: "Time in nature",
			icon: "emoji_nature",
			severity: "success",
			tags: ["outdoors", "relaxation", "health", "calm"],
		},
		{
			name: "Doodle or sketch",
			icon: "draw",
			severity: "success",
			tags: ["creativity", "relaxation", "art", "mindfulness"],
		},
		{
			name: "Cold shower",
			icon: "bolt",
			severity: "success",
			tags: ["health", "energy", "discipline", "routine"],
		},
		{
			name: "Morning sunlight",
			icon: "wb_sunny",
			severity: "success",
			tags: ["vitamin D", "routine", "energy", "mood"],
		},
		{
			name: "Boating or sailing",
			icon: "sailing",
			severity: "success",
			tags: ["leisure", "outdoors", "water", "relaxation"],
		},
		{
			name: "kitesurfing",
			icon: "Kitesurfing",
			severity: "success",
			tags: ["sport", "adventure", "water", "fun"],
		},
		{
			name: "surfing",
			icon: "Surfing",
			severity: "success",
			tags: ["sport", "water", "health", "adventure"],
		},
		{
			name: "Visit a park",
			icon: "park",
			severity: "success",
			tags: ["outdoors", "nature", "relaxation", "leisure"],
		},
		{
			name: "Walk in the forest",
			icon: "forest",
			severity: "success",
			tags: ["nature", "calm", "outdoors", "mental health"],
		},
		{
			name: "Attend an event",
			icon: "event",
			severity: "success",
			tags: ["social", "community", "entertainment", "fun"],
		},
		{
			name: "Socialize with friends",
			icon: "group",
			severity: "success",
			tags: ["social", "connection", "mental health", "fun"],
		},
		{
			name: "Skincare routine",
			icon: "face",
			severity: "success",
			tags: ["self-care", "health", "beauty", "routine"],
		},
		{
			name: "Face massage",
			icon: "face_retouching_natural",
			severity: "success",
			tags: ["relaxation", "routine", "self-care", "calm"],
		},
		{
			name: "Make a decision",
			icon: "gavel",
			severity: "success",
			tags: ["focus", "productivity", "clarity", "planning"],
		},
		{
			name: "Explore new places",
			icon: "travel_explore",
			severity: "success",
			tags: ["travel", "adventure", "curiosity", "discovery"],
		},
		{
			name: "Watch documentary",
			icon: "public",
			severity: "success",
			tags: ["education", "learning", "entertainment", "growth"],
		},
		{
			icon: "theaters",
			name: "Watch a movie",
			severity: "success",
			tags: ["entertainment", "relaxation", "fun", "media"],
		},
		{
			name: "Play basketball",
			icon: "sports_basketball",
			severity: "success",
			tags: ["sport", "fitness", "teamwork", "fun"],
		},
		{
			icon: "sports_esports",
			name: "Play video games",
			severity: "success",
			tags: ["fun", "relaxation", "entertainment", "tech"],
		},
		{
			icon: "sports_mma",
			name: "Martial arts training",
			severity: "success",
			tags: ["discipline", "fitness", "strength", "focus"],
		},
		{
			name: "skateboarding",
			icon: "Skateboarding",
			severity: "success",
			tags: ["sport", "balance", "fun", "outdoors"],
		},
		{
			name: "roller skating",
			icon: "roller_skating",
			severity: "success",
			tags: ["fitness", "fun", "sport", "recreation"],
		},
		{
			name: "snowboarding",
			icon: "Snowboarding",
			severity: "success",
			tags: ["winter", "sport", "adventure", "fun"],
		},
		{
			name: "ice_skating",
			icon: "ice_skating",
			severity: "success",
			tags: ["winter", "fun", "fitness", "balance"],
		},
		{
			name: "kayaking",
			icon: "Kayaking",
			severity: "success",
			tags: ["water", "adventure", "fitness", "outdoors"],
		},
		{
			name: "paragliding",
			icon: "Paragliding",
			severity: "success",
			tags: ["adventure", "extreme", "outdoors", "travel"],
		},
		{
			name: "Stretching exercises",
			icon: "back_hand",
			severity: "success",
			tags: ["mobility", "health", "fitness", "routine"],
		},
		{
			name: "Take supplements",
			icon: "health_and_safety",
			severity: "success",
			tags: ["health", "routine", "self-care", "vitamins"],
		},
		{
			icon: "medication",
			name: "Take medicine",
			severity: "success",
			tags: ["health", "routine", "treatment", "discipline"],
		},
		{
			icon: "wifi",
			name: "Limit screen time",
			severity: "success",
			tags: ["focus", "mental health", "productivity", "routine"],
		},
		{
			name: "Nap or rest",
			icon: "bed",
			severity: "success",
			tags: ["rest", "energy", "routine", "health"],
		},
		{
			name: "Digital detox",
			icon: "visibility_off",
			severity: "success",
			tags: ["focus", "mental health", "tech", "relaxation"],
		},
		{
			name: "Call family",
			icon: "call",
			severity: "success",
			tags: ["connection", "relationships", "love", "support"],
		},
		{
			name: "Ask for help",
			icon: "support",
			severity: "success",
			tags: ["mental health", "community", "communication", "growth"],
		},
		{
			name: "Offer help",
			icon: "handshake",
			severity: "success",
			tags: ["kindness", "support", "community", "connection"],
		},
		{
			name: "Watch clouds",
			icon: "cloud",
			severity: "success",
			tags: ["relaxation", "outdoors", "mental health", "mindfulness"],
		},
		{
			name: "Read affirmations",
			icon: "light",
			severity: "success",
			tags: ["mental health", "self-care", "positivity", "focus"],
		},
		{
			name: "Set goals",
			icon: "star",
			severity: "success",
			tags: ["productivity", "motivation", "planning", "growth"],
		},
		{
			name: "Review goals",
			icon: "edit_note",
			severity: "success",
			tags: ["planning", "reflection", "focus", "routine"],
		},
		{
			name: "Plan the week",
			icon: "calendar_month",
			severity: "success",
			tags: ["productivity", "planning", "routine", "organization"],
		},
		{
			name: "Set reminders",
			icon: "alarm_on",
			severity: "success",
			tags: ["planning", "routine", "focus", "organization"],
		},
		{
			name: "Limit notifications",
			icon: "notifications_active",
			severity: "success",
			tags: ["focus", "mental health", "productivity", "routine"],
		},
		{
			name: "Organize digital files",
			icon: "devices",
			severity: "success",
			tags: ["tech", "organization", "productivity", "routine"],
		},
		{
			name: "Take a photo",
			icon: "photo_camera",
			severity: "success",
			tags: ["creativity", "fun", "memory", "expression"],
		},
		{
			name: "Backup files",
			icon: "cloud_upload",
			severity: "success",
			tags: ["tech", "security", "organization", "productivity"],
		},
		{
			name: "Recycle",
			icon: "recycling",
			severity: "success",
			tags: ["environment", "responsibility", "routine", "awareness"],
		},
		{
			name: "Sustainable action",
			icon: "eco",
			severity: "success",
			tags: ["eco", "responsibility", "green", "awareness"],
		},
		{
			name: "Compost food waste",
			icon: "compost",
			severity: "success",
			tags: ["eco", "home", "environment", "routine"],
		},
		{
			name: "Save energy",
			icon: "energy_savings_leaf",
			severity: "success",
			tags: ["eco", "responsibility", "home", "sustainability"],
		},
		{
			name: "Water plants",
			icon: "local_florist",
			severity: "success",
			tags: ["home", "routine", "nature", "care"],
		},
		{
			name: "Organize closet",
			icon: "inventory",
			severity: "success",
			tags: ["organization", "home", "routine", "minimalism"],
		},
		{
			name: "Organize documents",
			icon: "folder",
			severity: "success",
			tags: ["productivity", "organization", "routine", "focus"],
		},
		{
			name: "Send a gift",
			icon: "redeem",
			severity: "success",
			tags: ["kindness", "relationships", "social", "gratitude"],
		},
		{
			name: "Practice balance",
			icon: "balance",
			severity: "success",
			tags: ["mobility", "fitness", "focus", "health"],
		},
		{
			name: "travel_luggage",
			icon: "Pack travel bag",
			severity: "success",
			tags: ["planning", "travel", "routine", "organization"],
		},
		{
			name: "Connect with strangers",
			icon: "connect_without_contact",
			severity: "success",
			tags: ["social", "connection", "growth", "confidence"],
		},
		{
			name: "Play with children",
			icon: "child_friendly",
			severity: "success",
			tags: ["family", "fun", "connection", "care"],
		},
		{
			name: "Smile at a stranger",
			icon: "emoji_emotions",
			severity: "success",
			tags: ["positivity", "social", "kindness", "connection"],
		},
		{
			name: "Practice drawing",
			icon: "draw",
			severity: "success",
			tags: ["creativity", "art", "fun", "expression"],
		},
		{
			name: "Paint or color",
			icon: "brush",
			severity: "success",
			tags: ["art", "creativity", "relaxation", "expression"],
		},
		{
			name: "Listen to music",
			icon: "music_note",
			severity: "success",
			tags: ["relaxation", "fun", "mental health", "entertainment"],
		},
		{
			name: "Practice instrument",
			icon: "piano",
			severity: "success",
			tags: ["creativity", "music", "discipline", "growth"],
		},
		{
			name: "Cook new recipe",
			icon: "soup_kitchen",
			severity: "success",
			tags: ["food", "creativity", "fun", "home"],
		},
		{
			name: "Eat out",
			icon: "restaurant",
			severity: "success",
			tags: ["food", "fun", "social", "pleasure"],
		},
		{
			name: "Fast for health",
			icon: "no_food",
			severity: "success",
			tags: ["health", "discipline", "routine", "wellness"],
		},
		{
			name: "Dress up nicely",
			icon: "style",
			severity: "success",
			tags: ["confidence", "self-care", "style", "routine"],
		},
		{
			name: "Positive self-talk",
			icon: "mindfulness",
			severity: "success",
			tags: ["mental health", "growth", "self-care", "confidence"],
		},
		{
			name: "Complete a task",
			icon: "task_alt",
			severity: "success",
			tags: ["productivity", "focus", "routine", "success"],
		},
		{
			name: "Finish a project",
			icon: "done_outline",
			severity: "success",
			tags: ["focus", "success", "work", "growth"],
		},
		{
			name: "Wind down before bed",
			icon: "shield_moon",
			severity: "success",
			tags: ["sleep", "routine", "health", "relaxation"],
		},
		{
			name: "Morning coffee",
			icon: "coffee",
			severity: "success",
			tags: ["routine", "energy", "pleasure", "habit"],
		},
		{
			name: "Avoid alcohol",
			icon: "no_drinks",
			severity: "success",
			tags: ["health", "discipline", "routine", "mental health"],
		},
		{
			name: "Avoid smoking",
			icon: "smoke_free",
			severity: "success",
			tags: ["health", "discipline", "wellness", "routine"],
		},
		{
			name: "Organize meds",
			icon: "local_pharmacy",
			severity: "success",
			tags: ["health", "routine", "self-care", "home"],
		},
		{
			name: "Change password",
			icon: "security",
			severity: "success",
			tags: ["security", "tech", "routine", "digital"],
		},
		{
			name: "Report a bug",
			icon: "bug_report",
			severity: "success",
			tags: ["tech", "help", "support", "maintenance"],
		},
		{
			name: "Get sunlight",
			icon: "light_mode",
			severity: "success",
			tags: ["health", "vitamin d", "wellness", "outdoors"],
		},
		{
			name: "Adjust room temp",
			icon: "thermostat",
			severity: "success",
			tags: ["comfort", "wellness", "routine", "home"],
		},
		{
			name: "Order food",
			icon: "takeout_dining",
			severity: "success",
			tags: ["food", "comfort", "leisure", "convenience"],
		},
		{
			name: "Organize garage",
			icon: "garage",
			severity: "success",
			tags: ["home", "organization", "cleaning", "routine"],
		},
		{
			name: "Tidy up",
			icon: "cleaning_services",
			severity: "success",
			tags: ["cleaning", "routine", "productivity", "home"],
		},
		{
			name: "Fix something",
			icon: "plumbing",
			severity: "success",
			tags: ["home", "maintenance", "responsibility", "task"],
		},
		{
			name: "Play with pet",
			icon: "pets",
			severity: "success",
			tags: ["animals", "joy", "connection", "care"],
		},
		{
			name: "Yard work",
			icon: "yard",
			severity: "success",
			tags: ["home", "outdoors", "cleaning", "routine"],
		},
		{
			name: "Enjoy cozy time",
			icon: "fireplace",
			severity: "success",
			tags: ["comfort", "relaxation", "home", "mental health"],
		},
		{
			name: "Check first aid kit",
			icon: "emergency",
			severity: "success",
			tags: ["safety", "health", "preparedness", "home"],
		},
		{
			name: "Grocery shopping",
			icon: "shopping_cart",
			severity: "success",
			tags: ["food", "routine", "home", "task"],
		},
		{
			name: "Track expenses",
			icon: "receipt_long",
			severity: "success",
			tags: ["finance", "discipline", "organization", "planning"],
		},
		{
			name: "Pay bills",
			icon: "credit_card",
			severity: "success",
			tags: ["finance", "routine", "responsibility", "organization"],
		},
		{
			name: "Reward yourself",
			icon: "redeem",
			severity: "success",
			tags: ["self-care", "motivation", "pleasure", "growth"],
		},
		{
			name: "Reflect on progress",
			icon: "equalizer",
			severity: "success",
			tags: ["growth", "planning", "reflection", "routine"],
		},
		{
			name: "Check statistics",
			icon: "leaderboard",
			severity: "success",
			tags: ["data", "planning", "routine", "productivity"],
		},
		{
			name: "Solve a quiz",
			icon: "quiz",
			severity: "success",
			tags: ["fun", "brain", "mental health", "learning"],
		},
		{
			name: "Do therapy",
			icon: "psychology",
			severity: "success",
			tags: ["mental health", "support", "self-care", "growth"],
		},
		{
			name: "Take a class",
			icon: "school",
			severity: "success",
			tags: ["learning", "growth", "education", "discipline"],
		},
		{
			name: "Practice coding",
			icon: "code",
			severity: "success",
			tags: ["tech", "learning", "growth", "discipline"],
		},
		{
			name: "Learn a language",
			icon: "translate",
			severity: "success",
			tags: ["learning", "growth", "education", "brain"],
		},
		{
			name: "Think of new idea",
			icon: "lightbulb",
			severity: "success",
			tags: ["creativity", "growth", "productivity", "brainstorm"],
		},
		{
			name: "Do volunteer work",
			icon: "volunteer_activism",
			severity: "success",
			tags: ["kindness", "community", "support", "values"],
		},
		{
			name: "Work on self",
			icon: "self_improvement",
			severity: "success",
			tags: ["growth", "mental health", "reflection", "discipline"],
		},
		{
			name: "Track goal progress",
			icon: "flag",
			severity: "success",
			tags: ["planning", "growth", "productivity", "routine"],
		},
		{
			name: "Read saved content",
			icon: "bookmark",
			severity: "success",
			tags: ["learning", "relaxation", "focus", "media"],
		},
		{
			name: "Sync data",
			icon: "cloud_sync",
			severity: "success",
			tags: ["tech", "routine", "organization", "maintenance"],
		},
		{
			name: "Adjust lighting",
			icon: "nightlight",
			severity: "success",
			tags: ["comfort", "sleep", "routine", "health"],
		},
		{
			name: "Take a mindful pause",
			icon: "hourglass_top",
			severity: "success",
			tags: ["mental health", "mindfulness", "focus", "routine"],
		},
		{
			name: "Practice gratitude",
			icon: "sentiment_satisfied",
			severity: "success",
			tags: ["positivity", "mental health", "routine", "growth"],
		},
		{
			name: "Do something you love",
			icon: "favorite",
			severity: "success",
			tags: ["joy", "mental health", "pleasure", "balance"],
		},
		{
			name: "procrastinating important tasks",
			icon: "hourglass_disabled",
			severity: "danger",
			tags: ["procrastination", "laziness"],
		},
		{
			name: "browsing TikTok endlessly",
			icon: "smartphone",
			severity: "danger",
			tags: ["distraction", "addiction"],
		},
		{
			name: "eating chips late at night",
			icon: "fastfood",
			severity: "danger",
			tags: ["junk food", "addiction"],
		},
		{
			name: "starting the day without a plan",
			icon: "event_busy",
			severity: "danger",
			tags: ["procrastination", "stress"],
		},
		{
			name: "doomscrolling social media",
			icon: "public_off",
			severity: "danger",
			tags: ["distraction", "addiction"],
		},
		{
			name: "snacking out of boredom",
			icon: "restaurant",
			severity: "danger",
			tags: ["junk food", "stress"],
		},
		{
			name: "avoiding difficult tasks",
			icon: "block",
			severity: "danger",
			tags: ["procrastination", "stress"],
		},
		{
			name: "not getting up from desk for hours",
			icon: "chair",
			severity: "danger",
			tags: ["stress", "addiction"],
		},
		{
			name: "skipping workouts regularly",
			icon: "fitness_center",
			severity: "danger",
			tags: ["laziness", "procrastination"],
		},
		{
			name: "working until burnout",
			icon: "work",
			severity: "danger",
			tags: ["stress", "addiction"],
		},
		{
			name: "eating fast food several times a week",
			icon: "lunch_dining",
			severity: "danger",
			tags: ["junk food", "addiction"],
		},
		{
			name: "watching series all night",
			icon: "tv",
			severity: "danger",
			tags: ["distraction", "laziness"],
		},
		{
			name: "checking phone first thing in the morning",
			icon: "phone_android",
			severity: "danger",
			tags: ["addiction", "distraction"],
		},
		{
			name: "not preparing meals",
			icon: "no_meals",
			severity: "danger",
			tags: ["junk food", "laziness"],
		},
		{
			name: "leaving tasks to the last minute",
			icon: "alarm_off",
			severity: "danger",
			tags: ["procrastination", "stress"],
		},
		{
			name: "skipping breakfast",
			icon: "breakfast_dining",
			severity: "danger",
			tags: ["junk food", "laziness"],
		},
		{
			name: "overeating out of emotion",
			icon: "sentiment_very_dissatisfied",
			severity: "danger",
			tags: ["stress", "junk food"],
		},
		{
			name: "sleeping until noon",
			icon: "bedtime_off",
			severity: "danger",
			tags: ["laziness", "procrastination"],
		},
		{
			name: "ignoring to-do list",
			icon: "playlist_remove",
			severity: "danger",
			tags: ["procrastination", "laziness"],
		},
	]);

	const tag_categories = {
		sport: [
			"sport",
			"fitness",
			"movement",
			"exercise",
			"outdoors",
			"discipline",
			"routine",
		],
		health: [
			"health",
			"mental health",
			"wellness",
			"self-care",
			"body",
			"hygiene",
			"sleep",
			"relaxation",
			"balance",
			"energy",
			"vitamin d",
		],
		work: [
			"work",
			"productivity",
			"focus",
			"routine",
			"task",
			"planning",
			"organization",
			"responsibility",
			"discipline",
			"success",
			"data",
			"statistics",
		],
		learning: [
			"learning",
			"growth",
			"education",
			"brain",
			"reading",
			"study",
			"reflection",
			"knowledge",
		],
		relax: [
			"mindfulness",
			"relaxation",
			"mental health",
			"routine",
			"gratitude",
			"pause",
			"comfort",
			"sleep",
			"joy",
			"balance",
			"positivity",
			"self-care",
		],
		home: [
			"home",
			"cleaning",
			"cooking",
			"organization",
			"maintenance",
			"comfort",
			"routine",
			"preparedness",
			"safety",
			"responsibility",
		],
		social: [
			"social",
			"kindness",
			"connection",
			"community",
			"support",
			"relationships",
			"values",
			"positivity",
		],
		hobby: [
			"creativity",
			"fun",
			"expression",
			"entertainment",
			"art",
			"hobby",
			"music",
			"pleasure",
			"style",
			"media",
			"brainstorm",
			"joy",
		],
		finance: [
			"finance",
			"discipline",
			"responsibility",
			"planning",
			"organization",
		],
		tech: ["tech", "security", "digital", "maintenance", "data", "support"],
		negative: [
			"procrastination",
			"addiction",
			"junk food",
			"distraction",
			"stress",
			"laziness",
		],
	};

	const recentHabbits = ref<string[]>([]); // This will hold the recently used habbits

	const userHabbitsList = ref<UserHabbits[]>([]); // This will hold the user's selected habbits for each day
	const selectedDayHabbits = computed({
		get() {
			const key = toDateKey(refDate.value);
			const entry = userHabbitsList.value.find((item) => item.date === key);
			return entry ? entry.habbits : [];
		},
		set(newHabbits) {
			const key = toDateKey(refDate.value);
			const index = userHabbitsList.value.findIndex(
				(item) => item.date === key
			);
			if (index !== -1) {
				userHabbitsList.value[index].habbits = newHabbits;
			} else {
				userHabbitsList.value.push({
					date: key,
					habbits: newHabbits,
				});
			}
		},
	});

	// Goals refs
	const dailyGoalsList = ref<Goal[]>([]);
	const dailyGoalsColored = computed<Goal[]>(() => {
		const formatedGoals = [];
		const counters: Record<string, number> = {};

		for (const goal of dailyGoalsList.value) {
			const currentDayTaskCount = selectedDayHabbits.value.filter(
				(g) => g.name === goal.name
			).length;

			if (!counters.hasOwnProperty(goal.name)) {
				counters[goal.name] = 1;
			} else {
				counters[goal.name] = counters[goal.name] + 1;
			}

			if (counters[goal.name] <= currentDayTaskCount) {
				formatedGoals.push({
					...goal,
					severity: goal.severity,
				});
			} else {
				formatedGoals.push({
					...goal,
					severity: "empty",
				});
			}
		}
		return formatedGoals;
	});

	const loadedStartDate = ref(
		new Date(new Date().setDate(new Date().getDate() - 7))
	);
	const loadedEndDate = ref(new Date()); // today
	async function loadHabbitsForDate(selectedDate: Date) {
		if (
			selectedDate < loadedStartDate.value ||
			selectedDate > loadedEndDate.value
		) {
			console.log("Laduje nowy zakres dat");

			const newStartDate = new Date(selectedDate);
			newStartDate.setDate(newStartDate.getDate() - 7);
			const newEndDate = new Date(selectedDate);
			newEndDate.setDate(newEndDate.getDate() + 7);

			// Fetch data for the new range
			await getDailyHabbitsInRange(newStartDate, newEndDate);

			// Update the loaded range
			loadedStartDate.value =
				newStartDate < loadedStartDate.value
					? newStartDate
					: loadedStartDate.value;
			loadedEndDate.value =
				newEndDate > loadedEndDate.value ? newEndDate : loadedEndDate.value;
		}
	}

	const getDailyHabbitsInRange = async (
		startDate: Date | null = null,
		endDate: Date | null = null
	) => {
		try {
			const _startDate =
				startDate || new Date(new Date().setDate(new Date().getDate() - 7));
			const _endDate = endDate || new Date();

			const habbitsRef = collection(db, "users", "user1", "habbits");
			const q = query(
				habbitsRef,
				where("date", ">=", toDateKey(_startDate)),
				where("date", "<=", toDateKey(_endDate))
			);
			const querySnapshot = await getDocs(q);

			querySnapshot.forEach((doc) => {
				const { date, habbits } = doc.data();

				const alreadyExists = userHabbitsList.value.some(
					(entry) => entry.date === date
				);

				if (!alreadyExists) {
					userHabbitsList.value.push({ date, habbits });
				}
			});
		} catch (error) {
			console.error("Error fetching daily habbits:", error);
		}
	};

	// Date functions
	function changeDate(direction: number) {
		refDate.value.setUTCDate(refDate.value.getUTCDate() + direction);
		refDate.value.setUTCHours(0, 0, 0, 0);
		refDate.value = new Date(refDate.value);
	}

	function isToday() {
		const today = new Date();
		return (
			refDate.value.getDate() === today.getDate() &&
			refDate.value.getMonth() === today.getMonth() &&
			refDate.value.getFullYear() === today.getFullYear()
		);
	}
	function setDate(date: Date) {
		refDate.value = new Date(date);
	}

	// Habbit functions
	async function addHabbitToSelectedDay(habbit: Habbit) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userHabbitsList.value.find(
			(day) => day.date === formattedDate
		);
		const habbitWithId = { ...habbit, id: nanoid() };

		try {
			const habbitsRef = doc(db, "users", "user1", "habbits", formattedDate);

			if (dayEntry) {
				await updateDoc(habbitsRef, {
					habbits: [...dayEntry.habbits, habbitWithId],
				});
				dayEntry.habbits.push(habbitWithId);
			} else {
				await setDoc(habbitsRef, {
					date: formattedDate,
					habbits: [habbitWithId],
				});
				userHabbitsList.value.push({
					date: formattedDate,
					habbits: [habbitWithId],
				});
			}
			addToRecentHabbits(habbit.name);
		} catch (error) {
			console.error("Error adding habbit to Firestore:", error);
		}
	}

	async function deleteHabbitFromSelectedDay(habbit: Habbit) {
		const formattedDate = toDateKey(refDate.value);
		const dayEntry = userHabbitsList.value.find(
			(day) => day.date === formattedDate
		);

		if (dayEntry) {
			const index = dayEntry.habbits.findIndex((t) => t.name === habbit.name);
			const updatedHabbits = [...dayEntry.habbits];
			updatedHabbits.splice(index, 1);
			if (index !== -1) {
				try {
					const habbitsRef = doc(
						db,
						"users",
						"user1",
						"habbits",
						formattedDate
					);
					await updateDoc(habbitsRef, {
						habbits: updatedHabbits,
					});
					dayEntry.habbits.splice(index, 1);
				} catch (error) {
					console.error("Error removing habbit from Firestore:", error);
				}
			}
		}
	}

	// Goals functions
	async function loadDailyGoals() {
		try {
			const userDocRef = doc(db, "users", "user1");
			const userDoc = await getDoc(userDocRef);

			if (userDoc.exists() && userDoc.data().dailyGoals) {
				dailyGoalsList.value = userDoc.data().dailyGoals;
			} else {
				console.log("No dailyGoals found for the user.");
			}
		} catch (error) {
			console.error("Error loading dailyGoals from Firestore:", error);
		}
	}

	async function addDailyGoal(goal: Goal) {
		try {
			const newGoal = { ...goal, id: nanoid(), severity: goal.severity };
			const updatedList = [...dailyGoalsList.value, newGoal];

			const userDocRef = doc(db, "users", "user1");
			await updateDoc(userDocRef, { dailyGoals: updatedList });

			dailyGoalsList.value = updatedList;
			console.log("Daily goal added successfully.");
		} catch (error) {
			console.error("Error adding daily goal to Firestore:", error);
		}
	}

	async function deleteDailyGoal(goal: Goal) {
		try {
			const updatedList = dailyGoalsList.value.filter((g) => g.id !== goal.id);

			const userDocRef = doc(db, "users", "user1");
			await updateDoc(userDocRef, { dailyGoals: updatedList });

			dailyGoalsList.value = updatedList;
			console.log("Daily goal deleted successfully.");
		} catch (error) {
			console.error("Error deleting daily goal from Firestore:", error);
		}
	}

	function onGoalClick(goal: Goal) {
		// It means that habbits is completed and we should remove habbit from current habbits
		if (goal.severity !== "empty") {
			deleteHabbitFromSelectedDay(goal);
		}
		// And that means it's not so we should add it to the list
		else {
			// change severity to original
			const goalFormatted = dailyGoalsList.value.find(
				(g) => g.name === goal.name
			);
			if (!goalFormatted) {
				console.error("Goal not found:", goal.name);
				return;
			}
			addHabbitToSelectedDay(goalFormatted);
		}
	}

	//Update habbits after drag and drop
	// This function updates the order of habbits in Firestore after drag and drop
	async function updateHabbitsOrderInFirestore() {
		const formattedDate = toDateKey(refDate.value);
		const entryIndex = userHabbitsList.value.findIndex(
			(day) => day.date === formattedDate
		);
		if (entryIndex === -1) return;

		const habbitsRef = doc(db, "users", "user1", "habbits", formattedDate);
		try {
			await updateDoc(habbitsRef, {
				habbits: userHabbitsList.value[entryIndex].habbits,
			});
			console.log("Habbits order updated in Firestore.");
		} catch (error) {
			console.error("Error updating habbits order in Firestore:", error);
		}
	}
	//Update goals after drag and drop
	// This function updates the order of daily goals in Firestore after drag and drop
	async function updateGoalsOrderInFirestore() {
		try {
			const userDocRef = doc(db, "users", "user1");
			await updateDoc(userDocRef, {
				dailyGoals: dailyGoalsList.value,
			});
			console.log("Daily goals order updated in Firestore.");
		} catch (error) {
			console.error("Error updating daily goals order:", error);
		}
	}

	function getGoalSeverity(goal: Goal) {
		const habbitsForToday = selectedDayHabbits.value;
		const matchingHabbits = habbitsForToday.filter((h) => h.name === goal.name);
		const sameGoals = dailyGoalsList.value.filter((g) => g.name === goal.name);
		const indexInSameGoals = sameGoals.findIndex((g) => g.id === goal.id);
		if (indexInSameGoals !== -1 && indexInSameGoals < matchingHabbits.length) {
			return goal.severity;
		}
		return "empty";
	}
	// Helper function to get the index of a goal instance in the list
	// It checks the name and id of the goal to find its index
	function getGoalInstanceIndex(goal: Goal, list: Goal[]) {
		let count = 0;
		for (let i = 0; i < list.length; i++) {
			if (list[i].name === goal.name) {
				if (list[i].id === goal.id) {
					return count;
				}
				count++;
			}
		}
		return -1;
	}

	// Recent habbits functions

	function addToRecentHabbits(habbitName: string) {
		const index = recentHabbits.value.indexOf(habbitName);

		if (index !== -1) {
			recentHabbits.value.splice(index, 1); // przenieś na początek
		}
		recentHabbits.value.unshift(habbitName); // dodaj na początek

		// Twarde przycięcie do 10
		recentHabbits.value = recentHabbits.value.slice(0, 10);

		saveRecentHabbits(recentHabbits.value);
	}

	// This function saves the recent habbits to the user's document in Firestore
	async function saveRecentHabbits(recentHabbits: string[]) {
		try {
			const userDocRef = doc(db, "users", "user1");
			await updateDoc(userDocRef, {
				recentlyUsed: recentHabbits,
			});
			console.log("recentHabbits saved to Firestore.");
		} catch (error) {
			console.error("Error saving recentHabbits to Firestore:", error);
		}
	}

	// This function loads the recent habbits from the user's document in Firestore
	// It will be called when the store is initialized
	// and when the user logs in
	// It will also be called when the user updates their recent habbits
	async function loadRecentHabbits() {
		try {
			const userDocRef = doc(db, "users", "user1");
			const docSnap = await getDoc(userDocRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				if (data.recentlyUsed && Array.isArray(data.recentlyUsed)) {
					recentHabbits.value = data.recentlyUsed;
					console.log("recentHabbits loaded from Firestore.");
				}
			}
		} catch (error) {
			console.error("Error loading recentHabbits from Firestore:", error);
		}
	}

	return {
		refDate,
		dateFormated,
		changeDate,
		allHabbitsList,
		userHabbitsList,
		isToday,
		setDate,
		selectedDayHabbits,
		addHabbitToSelectedDay,
		toDateKey,
		deleteHabbitFromSelectedDay,
		dailyGoalsList,
		addDailyGoal,
		deleteDailyGoal,
		dailyGoalsColored,
		onGoalClick,
		getDailyHabbitsInRange,
		loadHabbitsForDate,
		updateHabbitsOrderInFirestore,
		updateGoalsOrderInFirestore,
		getGoalSeverity,
		getGoalInstanceIndex,
		loadDailyGoals,
		tag_categories,
		recentHabbits,
		addToRecentHabbits,
		loadRecentHabbits,
	};
});
