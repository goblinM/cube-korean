import type { Chapter, Lesson } from "../data/lessons/types";
import type { UiLocale } from "./types";

const chapterEnglish: Record<string, string> = {
  "daily-food": "Everyday Food", "daily-travel": "Getting Around", "hotel-stay": "Hotels & Stays",
  tourism: "Travel & Sightseeing", shopping: "Shopping & Daily Life", hospital: "Hospital & Healthcare",
  work: "Work & Part-time Jobs", fitness: "Sports & Fitness", movies: "Movies & Television", social: "Social Life & Leisure",
};

const lessonEnglish: Record<string, string> = {
  "cafe-drinks": "Cafés & Drinks", breakfast: "Breakfast", "main-dishes": "Staples & Main Meals", fruits: "Fruit", vegetables: "Vegetables",
  "snacks-desserts": "Snacks & Desserts", restaurant: "Ordering at a Restaurant", "taste-texture": "Taste & Texture", kitchen: "Kitchen Items", ingredients: "Ingredients Review",
  "public-transport": "Public Transportation", directions: "Directions & Asking the Way", roads: "Roads & Driving", railway: "Train Station", airport: "Airport & Boarding",
  "local-transit": "Local Transportation", sightseeing: "Subway & Transfers", "travel-items": "Taking a Taxi", tickets: "Tickets & Reservations", emergency: "Help & Emergencies",
  accommodation: "Accommodation Basics", booking: "Hotel Reservations", "front-desk": "Front Desk & Check-in", "room-types": "Room Types", "room-facilities": "Room Facilities",
  bathroom: "Bathroom Items", services: "Hotel Services", problems: "Problems & Complaints", fees: "Charges & Payment", checkout: "Check-out & Luggage Storage",
  "tourism-1": "Planning an Itinerary", "tourism-2": "City Sightseeing", "tourism-3": "Natural Scenery", "tourism-4": "Mountains & Islands", "tourism-5": "Museums & Galleries",
  "tourism-6": "Palaces & Traditional Architecture", "tourism-7": "Parks & Theme Parks", "tourism-8": "Photos & Memories", "tourism-9": "Souvenirs & Guides", "tourism-10": "Travel Gear & Help",
  "shopping-1": "Malls & Stores", "shopping-2": "Clothing", "shopping-3": "Shoes, Bags & Accessories", "shopping-4": "Prices & Payment", "shopping-5": "Online Shopping & Delivery",
  "shopping-6": "Grocery Shopping", "shopping-7": "Home Furnishings", "shopping-8": "Daily Necessities", "shopping-9": "Returns & After-sales Service", "shopping-10": "Practical Shopping Phrases",
  "hospital-1": "Registration & Reception", "hospital-2": "Body Parts", "hospital-3": "Common Symptoms", "hospital-4": "Tests & Measurements", "hospital-5": "Treatment & Procedures",
  "hospital-6": "Pharmacy & Medication", "hospital-7": "Emergency Care & First Aid", "hospital-8": "Hospital Stay", "hospital-9": "Recovery & Prevention", "hospital-10": "Hospital Departments",
  "work-1": "The Office", "work-2": "Occupations", "work-3": "Job Hunting", "work-4": "Interviews", "work-5": "Schedules & Attendance",
  "work-6": "Pay & Contracts", "work-7": "Workplace Relationships", "work-8": "Meetings & Reports", "work-9": "Task Management", "work-10": "Part-time Work",
  "fitness-1": "Running & Walking", "fitness-2": "Ball Sports", "fitness-3": "The Gym", "fitness-4": "Fitness Equipment", "fitness-5": "Exercise Movements",
  "fitness-6": "Competition & Rules", "fitness-7": "Outdoor Sports", "fitness-8": "Sports Nutrition", "fitness-9": "Sports Injuries", "fitness-10": "Fitness & Health",
  "movies-1": "At the Cinema", "movies-2": "Television & Channels", "movies-3": "Film & TV Genres", "movies-4": "Video Production", "movies-5": "Cast & Crew",
  "movies-6": "Ways to Watch", "movies-7": "Plot & Reviews", "movies-8": "Film Music", "movies-9": "Variety Shows & Programs", "movies-10": "Screen Industry Terms",
  "social-1": "Friendships", "social-2": "Gatherings & Dates", "social-3": "Family Relationships", "social-4": "Hobbies & Interests", "social-5": "Expressing Emotions",
  "social-6": "Polite Expressions", "social-7": "Festivals & Celebrations", "social-8": "Chatting & Keeping in Touch", "social-9": "Leisure Time", "social-10": "Social Relationships",
};

export function chapterTitle(chapter: Chapter, locale: UiLocale): string {
  return locale === "en" ? chapterEnglish[chapter.id] ?? chapter.titleChinese : chapter.titleChinese;
}

export function lessonTitle(lesson: Lesson, locale: UiLocale): string {
  return locale === "en" ? lessonEnglish[lesson.id] ?? lesson.titleChinese : lesson.titleChinese;
}

export function missingEnglishCourseTitleIds(chapters: Chapter[]): string[] {
  return chapters.flatMap((chapter) => [
    ...(chapterEnglish[chapter.id] ? [] : [chapter.id]),
    ...chapter.lessons.flatMap((lesson) => lessonEnglish[lesson.id] ? [] : [lesson.id]),
  ]);
}
