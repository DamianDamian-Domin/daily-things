import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
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
import { useAuthStore } from "./auth";
import { useLoaderStore } from "./loader";
import { handleAsyncAction } from "@/stores/asyncActionHandler";

export const useHabbitsStore = defineStore("habbits", () => {
	const authStore = useAuthStore();
	const { userUid } = storeToRefs(authStore);
	const loader = useLoaderStore();

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
			display_name: "Gym",
			origin: "system",
		},
		{
			name: "cook",
			icon: "skillet",
			severity: "success",
			tags: ["home", "cooking", "routine", "responsibility"],
			display_name: "Cooking",
			origin: "system",
		},
		{
			name: "washing",
			icon: "local_laundry_service",
			severity: "success",
			tags: ["home", "cleaning", "responsibility", "routine"],
			display_name: "Laundry",
			origin: "system",
		},
		{
			name: "vacuum",
			icon: "vacuum",
			severity: "success",
			tags: ["home", "cleaning", "responsibility", "organization"],
			display_name: "Vacuuming",
			origin: "system",
		},
		{
			name: "mop",
			icon: "mop",
			severity: "success",
			tags: ["home", "cleaning", "routine", "organization"],
			display_name: "Mopping",
			origin: "system",
		},
		{
			name: "dishwasher",
			icon: "dishwasher",
			severity: "success",
			tags: ["home", "cleaning", "routine", "responsibility"],
			display_name: "Dishes",
			origin: "system",
		},
		{
			name: "Meet",
			icon: "groups",
			severity: "success",
			tags: ["social", "relationships", "connection", "community"],
			display_name: "Socialize",
			origin: "system",
		},
		{
			name: "Learn",
			icon: "school",
			severity: "success",
			tags: ["learning", "growth", "education", "knowledge"],
			display_name: "Learning",
			origin: "system",
		},
		{
			name: "shop",
			icon: "shopping_cart",
			severity: "success",
			tags: ["home", "responsibility", "preparedness"],
			display_name: "Shopping",
			origin: "system",
		},
		{
			name: "bike",
			icon: "pedal_bike",
			severity: "success",
			tags: ["sport", "health", "outdoors", "movement"],
			display_name: "Cycling",
			origin: "system",
		},
		{
			name: "refuel the car",
			icon: "local_gas_station",
			severity: "success",
			tags: ["home", "maintenance", "responsibility", "routine"],
			display_name: "Fuel car",
			origin: "system",
		},
		{
			name: "wash the car",
			icon: "local_car_wash",
			severity: "success",
			tags: ["home", "cleaning", "maintenance", "responsibility"],
			display_name: "Car wash",
			origin: "system",
		},
		{
			name: "Car repair",
			icon: "car_repair",
			severity: "success",
			tags: ["home", "maintenance", "responsibility", "safety"],
			display_name: "Car repair",
			origin: "system",
		},
		{
			name: "Self Care",
			icon: "self_care",
			severity: "success",
			tags: ["health", "self-care", "mental health", "wellness"],
			display_name: "Self-care",
			origin: "system",
		},
		{
			name: "Dentist",
			icon: "dentistry",
			severity: "success",
			tags: ["health", "self-care", "hygiene", "wellness"],
			display_name: "Dentist",
			origin: "system",
		},
		{
			name: "Gynecology",
			icon: "gynecology",
			severity: "success",
			tags: ["health", "wellness", "self-care", "routine"],
			display_name: "Gynecology",
			origin: "system",
		},
		{
			name: "Stadia Controller",
			icon: "stadia_controller",
			severity: "success",
			tags: ["hobby", "fun", "entertainment", "gaming"],
			display_name: "Gaming",
			origin: "system",
		},
		{
			name: "Meditation or mindfulness",
			icon: "self_improvement",
			severity: "success",
			tags: ["mental health", "relaxation", "focus", "self-care"],
			display_name: "Meditation",
			origin: "system",
		},
		{
			name: "Healthy meal",
			icon: "local_dining",
			severity: "success",
			tags: ["nutrition", "health", "food", "meal"],
			display_name: "Healthy meal",
			origin: "system",
		},
		{
			name: "Drink tea or coffee",
			icon: "emoji_food_beverage",
			severity: "success",
			tags: ["routine", "relaxation", "morning", "beverage"],
			display_name: "Tea or coffee",
			origin: "system",
		},
		{
			name: "Read a book",
			icon: "book",
			severity: "success",
			tags: ["education", "relaxation", "self-improvement", "focus"],
			display_name: "Read book",
			origin: "system",
		},
		{
			name: "Painting or drawing",
			icon: "brush",
			severity: "success",
			tags: ["creativity", "art", "expression", "relaxation"],
			display_name: "Painting",
			origin: "system",
		},
		{
			name: "Swimming",
			icon: "pool",
			severity: "success",
			tags: ["fitness", "health", "fun", "sport"],
			display_name: "Swimming",
			origin: "system",
		},
		{
			name: "Relaxation time",
			icon: "spa",
			severity: "success",
			tags: ["self-care", "mental health", "calm", "relaxation"],
			display_name: "Relax time",
			origin: "system",
		},
		{
			name: "Wake up early",
			icon: "alarm",
			severity: "success",
			tags: ["routine", "discipline", "morning", "productivity"],
			display_name: "Wake early",
			origin: "system",
		},
		{
			name: "Go to bed early",
			icon: "hotel",
			severity: "success",
			tags: ["sleep", "rest", "health", "routine"],
			display_name: "Early sleep",
			origin: "system",
		},
		{
			name: "Reflect on emotions",
			icon: "psychology",
			severity: "success",
			tags: ["mental health", "journaling", "reflection", "awareness"],
			display_name: "Reflect",
			origin: "system",
		},
		{
			name: "Gardening",
			icon: "yard",
			severity: "success",
			tags: ["outdoors", "nature", "health", "relaxation"],
			display_name: "Gardening",
			origin: "system",
		},
		{
			name: "Take care of pets",
			icon: "pets",
			severity: "success",
			tags: ["responsibility", "routine", "animals", "care"],
			display_name: "Pet care",
			origin: "system",
		},
		{
			name: "Sunlight exposure",
			icon: "light_mode",
			severity: "success",
			tags: ["health", "vitamin D", "outdoors", "mood"],
			display_name: "Sunlight",
			origin: "system",
		},
		{
			name: "Evening walk",
			icon: "dark_mode",
			severity: "success",
			tags: ["relaxation", "fitness", "routine", "outdoors"],
			display_name: "Evening walk",
			origin: "system",
		},
		{
			name: "Practice mindfulness",
			icon: "visibility",
			severity: "success",
			tags: ["focus", "calm", "mental health", "clarity"],
			display_name: "Mindfulness",
			origin: "system",
		},
		{
			name: "Study",
			icon: "school",
			severity: "success",
			tags: ["education", "discipline", "growth", "focus"],
			display_name: "Study",
			origin: "system",
		},
		{
			name: "Learn coding",
			icon: "code",
			severity: "success",
			tags: ["skills", "learning", "focus", "career"],
			display_name: "Coding",
			origin: "system",
		},
		{
			name: "Learn language",
			icon: "language",
			severity: "success",
			tags: ["skills", "communication", "growth", "learning"],
			display_name: "Language",
			origin: "system",
		},
		{
			name: "Play soccer",
			icon: "sports_soccer",
			severity: "success",
			tags: ["sport", "fitness", "fun", "teamwork"],
			display_name: "Soccer",
			origin: "system",
		},
		{
			name: "Play tennis",
			icon: "sports_tennis",
			severity: "success",
			tags: ["sport", "agility", "health", "fun"],
			display_name: "Tennis",
			origin: "system",
		},
		{
			name: "Play handball",
			icon: "sports_handball",
			severity: "success",
			tags: ["sport", "fitness", "teamwork", "exercise"],
			display_name: "Handball",
			origin: "system",
		},
		{
			name: "Running",
			icon: "run_circle",
			severity: "success",
			tags: ["sport", "endurance", "health", "cardio"],
			display_name: "Running",
			origin: "system",
		},
		{
			name: "Go hiking",
			icon: "hiking",
			severity: "success",
			tags: ["outdoors", "nature", "fitness", "relaxation"],
			display_name: "Hiking",
			origin: "system",
		},
		{
			name: "Rowing exercise",
			icon: "rowing",
			severity: "success",
			tags: ["fitness", "cardio", "health", "discipline"],
			display_name: "Rowing",
			origin: "system",
		},
		{
			name: "Sprint training",
			icon: "directions_run",
			severity: "success",
			tags: ["speed", "athletics", "fitness", "training"],
			display_name: "Sprint session",
			origin: "system",
		},
		{
			name: "Walking",
			icon: "directions_walk",
			severity: "success",
			tags: ["fitness", "health", "routine", "outdoors"],
			display_name: "Walk outside",
			origin: "system",
		},
		{
			name: "Climb stairs",
			icon: "stairs",
			severity: "success",
			tags: ["fitness", "routine", "cardio", "discipline"],
			display_name: "Stair climb",
			origin: "system",
		},
		{
			name: "Evening routine",
			icon: "bedtime",
			severity: "success",
			tags: ["sleep", "routine", "calm", "mental health"],
			display_name: "Evening prep",
			origin: "system",
		},
		{
			name: "Make coffee",
			icon: "coffee",
			severity: "success",
			tags: ["morning", "routine", "focus", "comfort"],
			display_name: "Brew coffee",
			origin: "system",
		},
		{
			name: "House cleaning",
			icon: "cleaning_services",
			severity: "success",
			tags: ["organization", "productivity", "routine", "discipline"],
			display_name: "Clean house",
			origin: "system",
		},
		{
			name: "Do laundry",
			icon: "laundry",
			severity: "success",
			tags: ["routine", "chores", "cleanliness", "home"],
			display_name: "Do laundry",
			origin: "system",
		},
		{
			name: "Manage budget",
			icon: "credit_card",
			severity: "success",
			tags: ["finance", "responsibility", "planning", "discipline"],
			display_name: "Budget check",
			origin: "system",
		},
		{
			name: "Track heart rate",
			icon: "monitor_heart",
			severity: "success",
			tags: ["health", "monitoring", "fitness", "technology"],
			display_name: "Heart rate",
			origin: "system",
		},
		{
			name: "Donate blood",
			icon: "bloodtype",
			severity: "success",
			tags: ["health", "help", "charity", "community"],
			display_name: "Give blood",
			origin: "system",
		},
		{
			name: "Express gratitude",
			icon: "favorite",
			severity: "success",
			tags: ["mental health", "self-care", "relationships", "happiness"],
			display_name: "Say thanks",
			origin: "system",
		},
		{
			name: "Volunteer work",
			icon: "volunteer_activism",
			severity: "success",
			tags: ["help", "community", "charity", "purpose"],
			display_name: "Volunteer",
			origin: "system",
		},
		{
			name: "Meaningful conversation",
			icon: "forum",
			severity: "success",
			tags: ["connection", "social", "mental health", "relationships"],
			display_name: "Deep talk",
			origin: "system",
		},
		{
			name: "Time in nature",
			icon: "emoji_nature",
			severity: "success",
			tags: ["outdoors", "relaxation", "health", "calm"],
			display_name: "Nature time",
			origin: "system",
		},
		{
			name: "Doodle or sketch",
			icon: "draw",
			severity: "success",
			tags: ["creativity", "relaxation", "art", "mindfulness"],
			display_name: "Sketch",
			origin: "system",
		},
		{
			name: "Cold shower",
			icon: "bolt",
			severity: "success",
			tags: ["health", "energy", "discipline", "routine"],
			display_name: "Cold shower",
			origin: "system",
		},
		{
			name: "Morning sunlight",
			icon: "wb_sunny",
			severity: "success",
			tags: ["vitamin D", "routine", "energy", "mood"],
			display_name: "Sunlight AM",
			origin: "system",
		},
		{
			name: "Boating or sailing",
			icon: "sailing",
			severity: "success",
			tags: ["leisure", "outdoors", "water", "relaxation"],
			display_name: "Boating",
			origin: "system",
		},
		{
			name: "kitesurfing",
			icon: "surfing", // poprawiona ikona z "Kitesurfing"
			severity: "success",
			tags: ["sport", "adventure", "water", "fun"],
			display_name: "Kitesurfing",
			origin: "system",
		},
		{
			name: "surfing",
			icon: "surfing", // poprawiona ikona z "Surfing"
			severity: "success",
			tags: ["sport", "water", "health", "adventure"],
			display_name: "Surfing",
			origin: "system",
		},
		{
			name: "Visit a park",
			icon: "park",
			severity: "success",
			tags: ["outdoors", "nature", "relaxation", "leisure"],
			display_name: "Go to park",
			origin: "system",
		},
		{
			name: "Walk in the forest",
			icon: "forest",
			severity: "success",
			tags: ["nature", "calm", "outdoors", "mental health"],
			display_name: "Forest walk",
			origin: "system",
		},
		{
			name: "Attend an event",
			icon: "event",
			severity: "success",
			tags: ["social", "community", "entertainment", "fun"],
			display_name: "Go to event",
			origin: "system",
		},
		{
			name: "Socialize with friends",
			icon: "group",
			severity: "success",
			tags: ["social", "connection", "mental health", "fun"],
			display_name: "Hang out",
			origin: "system",
		},
		{
			name: "Skincare routine",
			icon: "face",
			severity: "success",
			tags: ["self-care", "health", "beauty", "routine"],
			display_name: "Skincare",
			origin: "system",
		},
		{
			name: "Face massage",
			icon: "face_retouching_natural",
			severity: "success",
			tags: ["relaxation", "routine", "self-care", "calm"],
			display_name: "Face massage",
			origin: "system",
		},
		{
			name: "Make a decision",
			icon: "gavel",
			severity: "success",
			tags: ["focus", "productivity", "clarity", "planning"],
			display_name: "Decide",
			origin: "system",
		},
		{
			name: "Explore new places",
			icon: "travel_explore",
			severity: "success",
			tags: ["travel", "adventure", "curiosity", "discovery"],
			display_name: "Explore",
			origin: "system",
		},
		{
			name: "Watch documentary",
			icon: "public",
			severity: "success",
			tags: ["education", "learning", "entertainment", "growth"],
			display_name: "Docu time",
			origin: "system",
		},
		{
			name: "Watch a movie",
			icon: "theaters",
			severity: "success",
			tags: ["entertainment", "relaxation", "fun", "media"],
			display_name: "Movie night",
			origin: "system",
		},
		{
			name: "Play basketball",
			icon: "sports_basketball",
			severity: "success",
			tags: ["sport", "fitness", "teamwork", "fun"],
			display_name: "Basketball",
			origin: "system",
		},
		{
			icon: "sports_esports",
			name: "Play video games",
			severity: "success",
			tags: ["fun", "relaxation", "entertainment", "tech"],
			display_name: "Video games",
			origin: "system",
		},
		{
			icon: "sports_mma",
			name: "Martial arts training",
			severity: "success",
			tags: ["discipline", "fitness", "strength", "focus"],
			display_name: "Martial arts",
			origin: "system",
		},
		{
			name: "skateboarding",
			icon: "Skateboarding",
			severity: "success",
			tags: ["sport", "balance", "fun", "outdoors"],
			display_name: "Skateboard",
			origin: "system",
		},
		{
			name: "roller skating",
			icon: "roller_skating",
			severity: "success",
			tags: ["fitness", "fun", "sport", "recreation"],
			display_name: "Roller skate",
			origin: "system",
		},
		{
			name: "snowboarding",
			icon: "Snowboarding",
			severity: "success",
			tags: ["winter", "sport", "adventure", "fun"],
			display_name: "Snowboard",
			origin: "system",
		},
		{
			name: "ice_skating",
			icon: "ice_skating",
			severity: "success",
			tags: ["winter", "fun", "fitness", "balance"],
			display_name: "Ice skate",
			origin: "system",
		},
		{
			name: "kayaking",
			icon: "Kayaking",
			severity: "success",
			tags: ["water", "adventure", "fitness", "outdoors"],
			display_name: "Kayaking",
			origin: "system",
		},
		{
			name: "paragliding",
			icon: "Paragliding",
			severity: "success",
			tags: ["adventure", "extreme", "outdoors", "travel"],
			display_name: "Paragliding",
			origin: "system",
		},
		{
			name: "Stretching exercises",
			icon: "back_hand",
			severity: "success",
			tags: ["mobility", "health", "fitness", "routine"],
			display_name: "Stretching",
			origin: "system",
		},
		{
			name: "Take supplements",
			icon: "health_and_safety",
			severity: "success",
			tags: ["health", "routine", "self-care", "vitamins"],
			display_name: "Supplements",
			origin: "system",
		},
		{
			icon: "medication",
			name: "Take medicine",
			severity: "success",
			tags: ["health", "routine", "treatment", "discipline"],
			display_name: "Medication",
			origin: "system",
		},
		{
			icon: "wifi",
			name: "Limit screen time",
			severity: "success",
			tags: ["focus", "mental health", "productivity", "routine"],
			display_name: "Limit screen",
			origin: "system",
		},
		{
			name: "Nap or rest",
			icon: "bed",
			severity: "success",
			tags: ["rest", "energy", "routine", "health"],
			display_name: "Nap",
			origin: "system",
		},
		{
			name: "Digital detox",
			icon: "visibility_off",
			severity: "success",
			tags: ["focus", "mental health", "tech", "relaxation"],
			display_name: "Digital detox",
			origin: "system",
		},
		{
			name: "Call family",
			icon: "call",
			severity: "success",
			tags: ["connection", "relationships", "love", "support"],
			display_name: "Call family",
			origin: "system",
		},
		{
			name: "Ask for help",
			icon: "support",
			severity: "success",
			tags: ["mental health", "community", "communication", "growth"],
			display_name: "Ask help",
			origin: "system",
		},
		{
			name: "Offer help",
			icon: "handshake",
			severity: "success",
			tags: ["kindness", "support", "community", "connection"],
			display_name: "Offer help",
			origin: "system",
		},
		{
			name: "Watch clouds",
			icon: "cloud",
			severity: "success",
			tags: ["relaxation", "outdoors", "mental health", "mindfulness"],
			display_name: "Cloud watch",
			origin: "system",
		},
		{
			name: "Read affirmations",
			icon: "light",
			severity: "success",
			tags: ["mental health", "self-care", "positivity", "focus"],
			display_name: "Affirmation",
			origin: "system",
		},
		{
			name: "Set goals",
			icon: "star",
			severity: "success",
			tags: ["productivity", "motivation", "planning", "growth"],
			display_name: "Set goals",
			origin: "system",
		},
		{
			name: "Review goals",
			icon: "edit_note",
			severity: "success",
			tags: ["planning", "reflection", "focus", "routine"],
			display_name: "Review goals",
			origin: "system",
		},
		{
			name: "Plan the week",
			icon: "calendar_month",
			severity: "success",
			tags: ["productivity", "planning", "routine", "organization"],
			display_name: "Plan week",
			origin: "system",
		},
		{
			name: "Set reminders",
			icon: "alarm_on",
			severity: "success",
			tags: ["planning", "routine", "focus", "organization"],
			display_name: "Reminders",
			origin: "system",
		},
		{
			name: "Limit notifications",
			icon: "notifications_active",
			severity: "success",
			tags: ["focus", "mental health", "productivity", "routine"],
			display_name: "Mute alerts",
			origin: "system",
		},
		{
			name: "Organize digital files",
			icon: "devices",
			severity: "success",
			tags: ["tech", "organization", "productivity", "routine"],
			display_name: "Sort files",
			origin: "system",
		},
		{
			name: "Take a photo",
			icon: "photo_camera",
			severity: "success",
			tags: ["creativity", "fun", "memory", "expression"],
			display_name: "Take photo",
			origin: "system",
		},
		{
			name: "Backup files",
			icon: "cloud_upload",
			severity: "success",
			tags: ["tech", "security", "organization", "productivity"],
			display_name: "Backup",
			origin: "system",
		},
		{
			name: "Recycle",
			icon: "recycling",
			severity: "success",
			tags: ["environment", "responsibility", "routine", "awareness"],
			display_name: "Recycle",
			origin: "system",
		},
		{
			name: "Sustainable action",
			icon: "eco",
			severity: "success",
			tags: ["eco", "responsibility", "green", "awareness"],
			display_name: "Eco action",
			origin: "system",
		},
		{
			name: "Compost food waste",
			icon: "compost",
			severity: "success",
			tags: ["eco", "home", "environment", "routine"],
			display_name: "Compost",
			origin: "system",
		},
		{
			name: "Save energy",
			icon: "energy_savings_leaf",
			severity: "success",
			tags: ["eco", "responsibility", "home", "sustainability"],
			display_name: "Save energy",
			origin: "system",
		},
		{
			name: "Water plants",
			icon: "local_florist",
			severity: "success",
			tags: ["home", "routine", "nature", "care"],
			display_name: "Water plants",
			origin: "system",
		},
		{
			name: "Organize closet",
			icon: "inventory",
			severity: "success",
			tags: ["organization", "home", "routine", "minimalism"],
			display_name: "Sort closet",
			origin: "system",
		},
		{
			name: "Organize documents",
			icon: "folder",
			severity: "success",
			tags: ["productivity", "organization", "routine", "focus"],
			display_name: "Sort docs",
			origin: "system",
		},
		{
			name: "Send a gift",
			icon: "redeem",
			severity: "success",
			tags: ["kindness", "relationships", "social", "gratitude"],
			display_name: "Send gift",
			origin: "system",
		},
		{
			name: "Practice balance",
			icon: "balance",
			severity: "success",
			tags: ["mobility", "fitness", "focus", "health"],
			display_name: "Balance",
			origin: "system",
		},
		{
			name: "travel_luggage",
			icon: "Pack travel bag",
			severity: "success",
			tags: ["planning", "travel", "routine", "organization"],
			display_name: "Pack bag",
			origin: "system",
		},
		{
			name: "Connect with strangers",
			icon: "connect_without_contact",
			severity: "success",
			tags: ["social", "connection", "growth", "confidence"],
			origin: "system",
			display_name: "Connect people",
		},
		{
			name: "Play with children",
			icon: "child_friendly",
			severity: "success",
			tags: ["family", "fun", "connection", "care"],
			origin: "system",
			display_name: "Play w/ kids",
		},
		{
			name: "Smile at a stranger",
			icon: "emoji_emotions",
			severity: "success",
			tags: ["positivity", "social", "kindness", "connection"],
			origin: "system",
			display_name: "Smile to 1",
		},
		{
			name: "Practice drawing",
			icon: "draw",
			severity: "success",
			tags: ["creativity", "art", "fun", "expression"],
			origin: "system",
			display_name: "Sketching",
		},
		{
			name: "Paint or color",
			icon: "brush",
			severity: "success",
			tags: ["art", "creativity", "relaxation", "expression"],
			origin: "system",
			display_name: "Painting",
		},
		{
			name: "Listen to music",
			icon: "music_note",
			severity: "success",
			tags: ["relaxation", "fun", "mental health", "entertainment"],
			origin: "system",
			display_name: "Music time",
		},
		{
			name: "Practice instrument",
			icon: "piano",
			severity: "success",
			tags: ["creativity", "music", "discipline", "growth"],
			origin: "system",
			display_name: "Play music",
		},
		{
			name: "Cook new recipe",
			icon: "soup_kitchen",
			severity: "success",
			tags: ["food", "creativity", "fun", "home"],
			origin: "system",
			display_name: "New recipe",
		},
		{
			name: "Eat out",
			icon: "restaurant",
			severity: "success",
			tags: ["food", "fun", "social", "pleasure"],
			origin: "system",
			display_name: "Eat outside",
		},
		{
			name: "Fast for health",
			icon: "no_food",
			severity: "success",
			tags: ["health", "discipline", "routine", "wellness"],
			origin: "system",
			display_name: "Fasting",
		},
		{
			name: "Dress up nicely",
			icon: "style",
			severity: "success",
			tags: ["confidence", "self-care", "style", "routine"],
			origin: "system",
			display_name: "Dress well",
		},
		{
			name: "Positive self-talk",
			icon: "mindfulness",
			severity: "success",
			tags: ["mental health", "growth", "self-care", "confidence"],
			origin: "system",
			display_name: "Self-talk",
		},
		{
			name: "Complete a task",
			icon: "task_alt",
			severity: "success",
			tags: ["productivity", "focus", "routine", "success"],
			origin: "system",
			display_name: "One task",
		},
		{
			name: "Finish a project",
			icon: "done_outline",
			severity: "success",
			tags: ["focus", "success", "work", "growth"],
			origin: "system",
			display_name: "Finish proj.",
		},
		{
			name: "Wind down before bed",
			icon: "shield_moon",
			severity: "success",
			tags: ["sleep", "routine", "health", "relaxation"],
			origin: "system",
			display_name: "Relax before bed",
		},
		{
			name: "Morning coffee",
			icon: "coffee",
			severity: "success",
			tags: ["routine", "energy", "pleasure", "habit"],
			origin: "system",
			display_name: "Coffee time",
		},
		{
			name: "Avoid alcohol",
			icon: "no_drinks",
			severity: "success",
			tags: ["health", "discipline", "routine", "mental health"],
			origin: "system",
			display_name: "No alcohol",
		},
		{
			name: "Avoid smoking",
			icon: "smoke_free",
			severity: "success",
			tags: ["health", "discipline", "wellness", "routine"],
			origin: "system",
			display_name: "No smoking",
		},
		{
			name: "Organize meds",
			icon: "local_pharmacy",
			severity: "success",
			tags: ["health", "routine", "self-care", "home"],
			origin: "system",
			display_name: "Sort meds",
		},
		{
			name: "Change password",
			icon: "security",
			severity: "success",
			tags: ["security", "tech", "routine", "digital"],
			origin: "system",
			display_name: "New password",
		},
		{
			name: "Report a bug",
			icon: "bug_report",
			severity: "success",
			tags: ["tech", "help", "support", "maintenance"],
			origin: "system",
			display_name: "Report bug",
		},
		{
			name: "Get sunlight",
			icon: "light_mode",
			severity: "success",
			tags: ["health", "vitamin d", "wellness", "outdoors"],
			origin: "system",
			display_name: "Sunlight",
		},
		{
			name: "Adjust room temp",
			icon: "thermostat",
			severity: "success",
			tags: ["comfort", "wellness", "routine", "home"],
			origin: "system",
			display_name: "Set temp",
		},
		{
			name: "Order food",
			icon: "takeout_dining",
			severity: "success",
			tags: ["food", "comfort", "leisure", "convenience"],
			origin: "system",
			display_name: "Order food",
		},
		{
			name: "Organize garage",
			icon: "garage",
			severity: "success",
			tags: ["home", "organization", "cleaning", "routine"],
			origin: "system",
			display_name: "Clean garage",
		},
		{
			name: "Tidy up",
			icon: "cleaning_services",
			severity: "success",
			tags: ["cleaning", "routine", "productivity", "home"],
			origin: "system",
			display_name: "Tidy up",
		},
		{
			name: "Fix something",
			icon: "plumbing",
			severity: "success",
			tags: ["home", "maintenance", "responsibility", "task"],
			origin: "system",
			display_name: "Fix stuff",
		},
		{
			name: "Play with pet",
			icon: "pets",
			severity: "success",
			tags: ["animals", "joy", "connection", "care"],
			origin: "system",
			display_name: "Play w/ pet",
		},
		{
			name: "Yard work",
			icon: "yard",
			severity: "success",
			tags: ["home", "outdoors", "cleaning", "routine"],
			origin: "system",
			display_name: "Yard work",
		},
		{
			name: "Enjoy cozy time",
			icon: "fireplace",
			severity: "success",
			tags: ["comfort", "relaxation", "home", "mental health"],
			origin: "system",
			display_name: "Cozy time",
		},
		{
			name: "Check first aid kit",
			icon: "emergency",
			severity: "success",
			tags: ["safety", "health", "preparedness", "home"],
			origin: "system",
			display_name: "First aid kit",
		},
		{
			name: "Grocery shopping",
			icon: "shopping_cart",
			severity: "success",
			tags: ["food", "routine", "home", "task"],
			origin: "system",
			display_name: "Grocery shop",
		},
		{
			name: "Track expenses",
			icon: "receipt_long",
			severity: "success",
			tags: ["finance", "discipline", "organization", "planning"],
			origin: "system",
			display_name: "Track expense",
		},
		{
			name: "Pay bills",
			icon: "credit_card",
			severity: "success",
			tags: ["finance", "routine", "responsibility", "organization"],
			origin: "system",
			display_name: "Pay bills",
		},
		{
			name: "Reward yourself",
			icon: "redeem",
			severity: "success",
			tags: ["self-care", "motivation", "pleasure", "growth"],
			origin: "system",
			display_name: "Reward self",
		},
		{
			name: "Reflect on progress",
			icon: "equalizer",
			severity: "success",
			tags: ["growth", "planning", "reflection", "routine"],
			origin: "system",
			display_name: "Reflect prog.",
		},
		{
			name: "Check statistics",
			icon: "leaderboard",
			severity: "success",
			tags: ["data", "planning", "routine", "productivity"],
			origin: "system",
			display_name: "Stats check",
		},
		{
			name: "Solve a quiz",
			icon: "quiz",
			severity: "success",
			tags: ["fun", "brain", "mental health", "learning"],
			origin: "system",
			display_name: "Solve quiz",
		},
		{
			name: "Do therapy",
			icon: "psychology",
			severity: "success",
			tags: ["mental health", "support", "self-care", "growth"],
			origin: "system",
			display_name: "Therapy",
		},
		{
			name: "Take a class",
			icon: "school",
			severity: "success",
			tags: ["learning", "growth", "education", "discipline"],
			origin: "system",
			display_name: "Take class",
		},
		{
			name: "Practice coding",
			icon: "code",
			severity: "success",
			tags: ["tech", "learning", "growth", "discipline"],
			origin: "system",
			display_name: "Code practice",
		},
		{
			name: "Learn a language",
			icon: "translate",
			severity: "success",
			tags: ["learning", "growth", "education", "brain"],
			origin: "system",
			display_name: "Learn lang.",
		},
		{
			name: "Think of new idea",
			icon: "lightbulb",
			severity: "success",
			tags: ["creativity", "growth", "productivity", "brainstorm"],
			origin: "system",
			display_name: "New ideas",
		},
		{
			name: "Do volunteer work",
			icon: "volunteer_activism",
			severity: "success",
			tags: ["kindness", "community", "support", "values"],
			origin: "system",
			display_name: "Volunteer",
		},
		{
			name: "Work on self",
			icon: "self_improvement",
			severity: "success",
			tags: ["growth", "mental health", "reflection", "discipline"],
			origin: "system",
			display_name: "Self-work",
		},
		{
			name: "Track goal progress",
			icon: "flag",
			severity: "success",
			tags: ["planning", "growth", "productivity", "routine"],
			origin: "system",
			display_name: "Goal track",
		},
		{
			name: "Read saved content",
			icon: "bookmark",
			severity: "success",
			tags: ["learning", "relaxation", "focus", "media"],
			origin: "system",
			display_name: "Read saved",
		},
		{
			name: "Sync data",
			icon: "cloud_sync",
			severity: "success",
			tags: ["tech", "routine", "organization", "maintenance"],
			origin: "system",
			display_name: "Data sync",
		},
		{
			name: "Adjust lighting",
			icon: "nightlight",
			severity: "success",
			tags: ["comfort", "sleep", "routine", "health"],
			origin: "system",
			display_name: "Lighting adj.",
		},
		{
			name: "Take a mindful pause",
			icon: "hourglass_top",
			severity: "success",
			tags: ["mental health", "mindfulness", "focus", "routine"],
			origin: "system",
			display_name: "Mindful pause",
		},
		{
			name: "Practice gratitude",
			icon: "sentiment_satisfied",
			severity: "success",
			tags: ["positivity", "mental health", "routine", "growth"],
			origin: "system",
			display_name: "Gratitude",
		},
		{
			name: "Do something you love",
			icon: "favorite",
			severity: "success",
			tags: ["joy", "mental health", "pleasure", "balance"],
			origin: "system",
			display_name: "Do what you ❤️",
		},
		{
			name: "procrastinating important tasks",
			icon: "hourglass_disabled",
			severity: "danger",
			tags: ["procrastination", "laziness"],
			origin: "system",
			display_name: "Procrastinate",
		},
		{
			name: "browsing TikTok endlessly",
			icon: "smartphone",
			severity: "danger",
			tags: ["distraction", "addiction"],
			origin: "system",
			display_name: "Endless TikTok",
		},
		{
			name: "eating chips late at night",
			icon: "fastfood",
			severity: "danger",
			tags: ["junk food", "addiction"],
			origin: "system",
			display_name: "Late chips",
		},
		{
			name: "starting the day without a plan",
			icon: "event_busy",
			severity: "danger",
			tags: ["procrastination", "stress"],
			origin: "system",
			display_name: "No plan start",
		},
		{
			name: "doomscrolling social media",
			icon: "public_off",
			severity: "danger",
			tags: ["distraction", "addiction"],
			origin: "system",
			display_name: "Doomscroll",
		},
		{
			name: "snacking out of boredom",
			icon: "restaurant",
			severity: "danger",
			tags: ["junk food", "stress"],
			origin: "system",
			display_name: "Snack bored",
		},
		{
			name: "avoiding difficult tasks",
			icon: "block",
			severity: "danger",
			tags: ["procrastination", "stress"],
			origin: "system",
			display_name: "Avoid tasks",
		},
		{
			name: "not getting up from desk for hours",
			icon: "chair",
			severity: "danger",
			tags: ["stress", "addiction"],
			origin: "system",
			display_name: "Desk for hrs",
		},
		{
			name: "skipping workouts regularly",
			icon: "fitness_center",
			severity: "danger",
			tags: ["laziness", "procrastination"],
			origin: "system",
			display_name: "Skip workout",
		},
		{
			name: "working until burnout",
			icon: "work",
			severity: "danger",
			tags: ["stress", "addiction"],
			origin: "system",
			display_name: "Burnout work",
		},
		{
			name: "eating fast food several times a week",
			icon: "lunch_dining",
			severity: "danger",
			tags: ["junk food", "addiction"],
			origin: "system",
			display_name: "Frequent fastf",
		},
		{
			name: "watching series all night",
			icon: "tv",
			severity: "danger",
			tags: ["distraction", "laziness"],
			origin: "system",
			display_name: "Series allnite",
		},
		{
			name: "checking phone first thing in the morning",
			icon: "phone_android",
			severity: "danger",
			tags: ["addiction", "distraction"],
			origin: "system",
			display_name: "Phone AM",
		},
		{
			name: "not preparing meals",
			icon: "no_meals",
			severity: "danger",
			tags: ["junk food", "laziness"],
			origin: "system",
			display_name: "No meal prep",
		},
		{
			name: "leaving tasks to the last minute",
			icon: "alarm_off",
			severity: "danger",
			tags: ["procrastination", "stress"],
			origin: "system",
			display_name: "Last min task",
		},
		{
			name: "skipping breakfast",
			icon: "breakfast_dining",
			severity: "danger",
			tags: ["junk food", "laziness"],
			origin: "system",
			display_name: "Skip breakfast",
		},
		{
			name: "overeating out of emotion",
			icon: "sentiment_very_dissatisfied",
			severity: "danger",
			tags: ["stress", "junk food"],
			origin: "system",
			display_name: "Emo eating",
		},
		{
			name: "sleeping until noon",
			icon: "bedtime_off",
			severity: "danger",
			tags: ["laziness", "procrastination"],
			origin: "system",
			display_name: "Sleep late",
		},
		{
			name: "ignoring to-do list",
			icon: "playlist_remove",
			severity: "danger",
			tags: ["procrastination", "laziness"],
			origin: "system",
			display_name: "Ignore todos",
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

	const specialFilters = [
		{ name: "recently", display_name: "Recently", icon: "pi pi-clock" },
		{ name: "all", display_name: "All", icon: "pi pi-list" },
		{ name: "user", display_name: "User", icon: "pi pi-user" },
	];

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
		await loader.run(async () => {
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
		});
	}

	const getDailyHabbitsInRange = async (
		startDate: Date | null = null,
		endDate: Date | null = null
	) => {
		await loader.run(async () => {
			try {
				const _startDate =
					startDate || new Date(new Date().setDate(new Date().getDate() - 7));
				const _endDate = endDate || new Date();
				const habbitsRef = collection(db, "users", userUid.value!!, "habbits");
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
			try {
				const _startDate =
					startDate || new Date(new Date().setDate(new Date().getDate() - 7));
				const _endDate = endDate || new Date();
				const habbitsRef = collection(db, "users", userUid.value!!, "habbits");
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
		});
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
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userHabbitsList.value.find(
					(day) => day.date === formattedDate
				);
				const habbitWithId = { ...habbit, id: nanoid() };

				try {
					const habbitsRef = doc(
						db,
						"users",
						userUid.value!!,
						"habbits",
						formattedDate
					);

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
			},
			"Habbit added!",
			"Failed to add habbit."
		);
	}

	async function deleteHabbitFromSelectedDay(habbit: Habbit) {
		await handleAsyncAction(
			async () => {
				const formattedDate = toDateKey(refDate.value);
				const dayEntry = userHabbitsList.value.find(
					(day) => day.date === formattedDate
				);

				if (dayEntry) {
					const index = dayEntry.habbits.findIndex(
						(t) => t.name === habbit.name
					);
					const updatedHabbits = [...dayEntry.habbits];
					updatedHabbits.splice(index, 1);
					if (index !== -1) {
						try {
							const habbitsRef = doc(
								db,
								"users",
								userUid.value!!,
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
			},
			"Habbit deleted!",
			"Failed to deleted habbit."
		);
	}

	// Goals functions
	async function loadDailyGoals() {
		await loader.run(async () => {
			try {
				const userDocRef = doc(db, "users", userUid.value!!);
				const userDoc = await getDoc(userDocRef);

				if (userDoc.exists() && userDoc.data().dailyGoals) {
					dailyGoalsList.value = userDoc.data().dailyGoals;
				} else {
					setDoc(userDocRef, { dailyGoals: [] }, { merge: true });
					console.log("No dailyGoals found for the user. Creating empty entry");
				}
			} catch (error) {
				console.error("Error loading dailyGoals from Firestore:", error);
			}
		});
	}

	async function addDailyGoal(goal: Goal) {
		await handleAsyncAction(
			async () => {
				try {
					const newGoal = { ...goal, id: nanoid(), severity: goal.severity };
					const updatedList = [...dailyGoalsList.value, newGoal];

					const userDocRef = doc(db, "users", userUid.value!!);

					await updateDoc(userDocRef, { dailyGoals: updatedList });

					dailyGoalsList.value = updatedList;
					console.log("Daily goal added successfully.");
				} catch (error) {
					console.error("Error adding daily goal to Firestore:", error);
				}
			},
			"Goal added!",
			"Failed to add goal."
		);
	}

	async function deleteDailyGoal(goal: Goal) {
		await handleAsyncAction(
			async () => {
				try {
					const updatedList = dailyGoalsList.value.filter(
						(g) => g.id !== goal.id
					);

					const userDocRef = doc(db, "users", userUid.value!!);
					await updateDoc(userDocRef, { dailyGoals: updatedList });

					dailyGoalsList.value = updatedList;
					console.log("Daily goal deleted successfully.");
				} catch (error) {
					console.error("Error deleting daily goal from Firestore:", error);
				}
			},
			"Goal deleted!",
			"Failed to deleted goal."
		);
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
		await loader.run(async () => {
			const formattedDate = toDateKey(refDate.value);
			const entryIndex = userHabbitsList.value.findIndex(
				(day) => day.date === formattedDate
			);
			if (entryIndex === -1) return;

			const habbitsRef = doc(
				db,
				"users",
				userUid.value!!,
				"habbits",
				formattedDate
			);
			try {
				await updateDoc(habbitsRef, {
					habbits: userHabbitsList.value[entryIndex].habbits,
				});
				console.log("Habbits order updated in Firestore.");
			} catch (error) {
				console.error("Error updating habbits order in Firestore:", error);
			}
		});
	}
	//Update goals after drag and drop
	// This function updates the order of daily goals in Firestore after drag and drop
	async function updateGoalsOrderInFirestore() {
		await loader.run(async () => {
			try {
				const userDocRef = doc(db, "users", userUid.value!!);
				await updateDoc(userDocRef, {
					dailyGoals: dailyGoalsList.value,
				});
				console.log("Daily goals order updated in Firestore.");
			} catch (error) {
				console.error("Error updating daily goals order:", error);
			}
		});
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
		await loader.run(async () => {
			try {
				const userDocRef = doc(db, "users", userUid.value!!);
				await updateDoc(userDocRef, {
					recentlyUsed: recentHabbits,
				});
				console.log("recentHabbits saved to Firestore.");
			} catch (error) {
				console.error("Error saving recentHabbits to Firestore:", error);
			}
		});
	}

	// This function loads the recent habbits from the user's document in Firestore
	// It will be called when the store is initialized
	// and when the user logs in
	// It will also be called when the user updates their recent habbits
	async function loadRecentHabbits() {
		await loader.run(async () => {
			const userDocRef = doc(db, "users", userUid.value!!);
			const docSnap = await getDoc(userDocRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				if (data.recentlyUsed && Array.isArray(data.recentlyUsed)) {
					recentHabbits.value = data.recentlyUsed;
					console.log("recentHabbits loaded from Firestore.");
				}
			}
		});
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
		specialFilters,
	};
});
