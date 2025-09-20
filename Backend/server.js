const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage
let users = [];
let workouts = {
    beginner: ["Push-ups", "Squats", "Plank"],
    intermediate: ["Pull-ups", "Lunges", "Burpees"],
    advanced: ["Deadlift", "Bench Press", "Box Jumps"]
};
let guidance = {
    "Push-ups": "Keep your back straight and elbows close to body.",
    "Squats": "Keep knees behind toes and back straight.",
    "Plank": "Keep your body straight and core tight.",
    "Pull-ups": "Use full range of motion, avoid swinging.",
    "Lunges": "Knee should not go beyond toes.",
    "Burpees": "Maintain steady pace, land softly.",
    "Deadlift": "Keep back straight, lift with legs.",
    "Bench Press": "Lower bar slowly, don't arch back.",
    "Box Jumps": "Land softly with knees slightly bent."
};
let qa = []; // Q&A storage

// Create user
app.post("/api/users", (req, res) => {
    const { username } = req.body;
    const user = { username, progress: [], level: 1, badges: [] };
    users.push(user);
    res.json(user);
});

// Get workout recommendations by level
app.get("/api/workouts/:level", (req, res) => {
    const level = req.params.level;
    res.json(workouts[level] || workouts["beginner"]);
});

// Get guidance for exercise
app.get("/api/guidance/:exercise", (req, res) => {
    const exercise = req.params.exercise;
    res.json({ guidance: guidance[exercise] || "No guidance available" });
});

// Update workout progress
app.post("/api/progress", (req, res) => {
    const { username, workout } = req.body;
    const user = users.find(u => u.username === username);
    if (user) {
        user.progress.push({ workout, date: new Date() });
        // Level up after every 3 workouts
        if (user.progress.length % 3 === 0) user.level += 1;
        // Award badge for every 5 workouts
        if (user.progress.length % 5 === 0) user.badges.push(`🏅 ${user.progress.length} workouts`);
        res.json({ message: "Progress updated", user });
    } else res.status(404).json({ message: "User not found" });
});

// Post a question
app.post("/api/qa", (req, res) => {
    const { username, question } = req.body;
    // Simple hardcoded answer for hackathon
    const answer = "Great question! Keep consistent and stay hydrated.";
    qa.push({ username, question, answer, date: new Date() });
    res.json({ message: "Question added", answer });
});

// Get all Q&A
app.get("/api/qa", (req, res) => {
    res.json(qa);
});

app.listen(5000, () => console.log("Server running on port 5000"));