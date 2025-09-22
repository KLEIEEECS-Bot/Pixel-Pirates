// src/App.js
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import confetti from "canvas-confetti";
import "./App.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
    const [username, setUsername] = useState("");
    const [userProfile, setUserProfile] = useState({
        level: "beginner",
        totalWorkouts: 0,
        xp: 0,
        badges: []
    });
    const [level, setLevel] = useState("beginner");
    const [workouts, setWorkouts] = useState([]);
    const [allowedExercises, setAllowedExercises] = useState([]);
    const [progress, setProgress] = useState([]);
    const [guidanceText, setGuidanceText] = useState("");
    const [question, setQuestion] = useState("");
    const [qaList, setQaList] = useState([]);
    const [selectedExercises, setSelectedExercises] = useState([]);

    const predefinedQA = useMemo(() => [
        { id: 1, question: "Best exercise for abs?", answer: "Crunches, planks, leg raises and progressive overload." },
        { id: 2, question: "How often should I train?", answer: "3–5 sessions per week is ideal for most people." },
        { id: 3, question: "How to avoid injuries?", answer: "Warm up, focus on form, progressive load and rest." },
        { id: 4, question: "How long should a session be?", answer: "30-60 minutes depending on goals and intensity." }
    ], []);

    const allWorkoutsSource = useMemo(() => [
        { id: "w1", name: "Push-ups", difficulty: "beginner" },
        { id: "w2", name: "Bodyweight Squats", difficulty: "beginner" },
        { id: "w3", name: "Lunges", difficulty: "beginner" },
        { id: "w4", name: "Plank", difficulty: "beginner" },
        { id: "w5", name: "Jumping Jacks", difficulty: "beginner" },
        { id: "w6", name: "Crunches", difficulty: "beginner" },
        { id: "w7", name: "Leg Raises", difficulty: "intermediate" },
        { id: "w8", name: "Mountain Climbers", difficulty: "intermediate" },
        { id: "w9", name: "Burpees", difficulty: "advanced" },
        { id: "w10", name: "Bicep Curls (dumbbell)", difficulty: "intermediate" },
        { id: "w11", name: "Jump Rope", difficulty: "intermediate" },
        { id: "w12", name: "Pull-ups", difficulty: "advanced" }
    ], []);

    const xpPerWorkout = 10;
    const xpThresholds = { beginner: 0, intermediate: 50, advanced: 150 };

    const normalizeWorkouts = (raw) => {
        if (!raw) return [];
        return raw.map((item, idx) => {
            if (typeof item === "string") return { id: `${item}-${idx}`, name: item, difficulty: "beginner" };
            return {
                id: item.id || item._id || `${item.name}-${idx}`,
                name: item.name || item.title || `workout-${idx}`,
                difficulty: item.difficulty || "beginner",
                guidance: item.guidance || item.description || ""
            };
        });
    };

    const fetchWorkouts = async(lvl = level) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/workouts/${lvl}`);
            const normalized = normalizeWorkouts(res.data);
            if (normalized.length === 0) throw new Error("Empty from backend");
            setWorkouts(normalized);
            setAllowedExercises(normalized.map((w) => w.id));
        } catch (err) {
            const filtered = allWorkoutsSource
                .filter((w) => lvl === "beginner" ? w.difficulty === "beginner" :
                    lvl === "intermediate" ? ["beginner", "intermediate"].includes(w.difficulty) :
                    true)
                .map((w) => ({...w }));
            setWorkouts(filtered);
            setAllowedExercises(filtered.map((w) => w.id));
            console.warn("fetchWorkouts fallback:", err.message || err);
        }
    };

    const createUser = async() => {
        if (!username) return alert("Enter username!");
        try {
            const res = await axios.post("http://localhost:5000/api/users", { username, level });
            const user = res.data.user || res.data;
            setUserProfile((profile) => ({
                ...profile,
                level: user.level || level,
                totalWorkouts: (user.totalWorkouts !== undefined && user.totalWorkouts !== null) ? user.totalWorkouts : profile.totalWorkouts,
                xp: (user.xp !== undefined && user.xp !== null) ? user.xp : profile.xp,
                badges: user.badges || profile.badges
            }));
            setProgress(user.progress || []);
            alert("User Created!");
            fetchWorkouts(level);
        } catch (err) {
            setUserProfile({ level, totalWorkouts: 0, xp: 0, badges: [] });
            setProgress([]);
            alert("User created locally (server unreachable).");
            fetchWorkouts(level);
        }
    };

    const fetchUserProfile = async() => {
        if (!username) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${username}`);
            const user = res.data.user || res.data;
            setUserProfile((prev) => ({
                ...prev,
                level: user.level || prev.level,
                totalWorkouts: (user.totalWorkouts !== undefined && user.totalWorkouts !== null) ? user.totalWorkouts : prev.totalWorkouts,
                xp: (user.xp !== undefined && user.xp !== null) ? user.xp : prev.xp,
                badges: user.badges || prev.badges
            }));
            setProgress(user.progress || []);
        } catch (err) {
            console.warn("fetchUserProfile failed:", err.message || err);
        }
    };

    const getGuidance = async(workout) => {
        const name = typeof workout === "string" ? workout : workout.name;
        try {
            const res = await axios.get(`http://localhost:5000/api/guidance/${encodeURIComponent(name)}`);
            setGuidanceText(`${name}: ${res.data.guidance || res.data || ""}`);
        } catch (err) {
            setGuidanceText(`${name}: Keep your core tight and focus on controlled reps.`);
            console.warn("getGuidance fallback:", err.message || err);
        }
    };

    const awardProgressRewards = (newTotalWorkouts, newXp) => {
        if (newTotalWorkouts > 0 && newTotalWorkouts % 3 === 0) {
            confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
        }

        setUserProfile((prev) => {
            let badges = [...(prev.badges || [])];
            if (newTotalWorkouts > 0 && newTotalWorkouts % 5 === 0) {
                badges.push(`🏅 ${newTotalWorkouts} workouts`);
            }

            let newLevel = prev.level;
            if (newXp >= xpThresholds.advanced) newLevel = "advanced";
            else if (newXp >= xpThresholds.intermediate) newLevel = "intermediate";
            else newLevel = "beginner";

            return {...prev, badges, totalWorkouts: newTotalWorkouts, xp: newXp, level: newLevel };
        });
    };

    const completeWorkout = async(workout) => {
        if (!username) return alert("Please create a user first.");
        const name = typeof workout === "string" ? workout : workout.name;
        try {
            const payload = { username, workout: name };
            const res = await axios.post("http://localhost:5000/api/progress", payload);
            const serverUser = res.data.user || res.data;
            const serverProgress = serverUser.progress || [];
            const normalized = serverProgress.map((p) => typeof p === "string" ? { date: new Date().toISOString(), workout: p } : p);
            setProgress(normalized);

            const newTotal = normalized.length;
            const newXp = (serverUser.xp !== undefined && serverUser.xp !== null) ? serverUser.xp : ((userProfile.xp !== undefined && userProfile.xp !== null) ? userProfile.xp : 0) + xpPerWorkout;
            awardProgressRewards(newTotal, newXp);
            alert(`Workout Completed! Level: ${serverUser.level || userProfile.level}`);
        } catch (err) {
            console.warn("completeWorkout fallback:", err.message || err);
            const newProgress = [...progress, { date: new Date().toISOString(), workout: name }];
            setProgress(newProgress);
            const newXp = ((userProfile.xp !== undefined && userProfile.xp !== null) ? userProfile.xp : 0) + xpPerWorkout;
            awardProgressRewards(newProgress.length, newXp);
            localStorage.setItem(`genfit_${username}_progress`, JSON.stringify(newProgress));
            alert(`Workout recorded locally. (${name})`);
        }
    };

    const postQuestion = async() => {
        if (!question) return alert("Type a question or pick a predefined one.");
        try {
            const res = await axios.post("http://localhost:5000/api/qa", { username, question });
            const answer = res.data.answer || "No answer from server.";
            alert("Answer: " + answer);
            setQuestion("");
        } catch (err) {
            const found = predefinedQA.find((q) => q.question.toLowerCase() === question.toLowerCase());
            alert("Answer (local): " + (found ? found.answer : "Sorry, no server."));
            setQuestion("");
        }
    };

    const saveRoutine = async() => {
        if (!username) return alert("Please create a user first.");
        if (selectedExercises.length === 0) return alert("Pick some exercises for the routine.");
        try {
            await axios.post("http://localhost:5000/api/routine", { username, exercises: selectedExercises });
            alert("Custom routine saved to server!");
        } catch (err) {
            const key = `genfit_${username}_routines`;
            const prev = JSON.parse(localStorage.getItem(key) || "[]");
            prev.push({ name: `Routine ${prev.length + 1}`, exercises: selectedExercises, savedAt: new Date().toISOString() });
            localStorage.setItem(key, JSON.stringify(prev));
            alert("Custom routine saved locally (server unreachable).");
        }
    };

    const handleLevelChange = (lvl) => {
        setLevel(lvl);
        setUserProfile((prev) => ({...prev, level: lvl }));
        fetchWorkouts(lvl);
    };

    const toggleAllowedExercise = (id) => {
        setAllowedExercises((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const toggleSelectedExercise = (id) => {
        setSelectedExercises((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    useEffect(() => {
        fetchWorkouts(level);
        if (username) fetchUserProfile();
    }, [level, username]);

    const chartData = {
        labels: progress.map((p) => new Date(p.date).toLocaleDateString()),
        datasets: [{
            label: "Workouts Completed",
            data: progress.map((_, i) => i + 1),
            borderColor: "rgba(76, 175, 80, 1)",
            backgroundColor: "rgba(76, 175, 80, 0.2)",
            fill: false
        }]
    };

    const xpToNext = useMemo(() => {
        if (userProfile.level === "beginner") return xpThresholds.intermediate;
        if (userProfile.level === "intermediate") return xpThresholds.advanced;
        return xpThresholds.advanced + 100;
    }, [userProfile.level]);

    const xpPct = Math.min(100, Math.round(((userProfile.xp !== undefined && userProfile.xp !== null ? userProfile.xp : 0) / xpToNext) * 100));

    return ( <
        div className = "app-container" >
        <
        h1 > 🏋🏻GenFit < /h1>

        { /* PROFILE */ } <
        div className = "profile" >
        <
        h2 > Profile: { username || "Guest" } < /h2> <
        p > < strong > Level: < /strong> {userProfile.level}</p >
        <
        p > < strong > Total Workouts: < /strong> {userProfile.totalWorkouts}</p >
        <
        p > < strong > XP: < /strong> {userProfile.xp !== undefined && userProfile.xp !== null ? userProfile.xp : 0} (Next: {xpToNext} XP)</p >
        <
        div className = "progress-bar-container" >
        <
        div className = "progress-bar-fill"
        style = {
            { width: `${xpPct}%` } }
        title = { `${xpPct}% to next milestone` } >
        < /div> <
        /div> <
        div >
        <
        strong > Badges: < /strong>{" "} {
            userProfile.badges && userProfile.badges.length === 0 ?
                "None" :
                userProfile.badges.map((b, idx) => ( <
                    span key = { idx }
                    className = "badge"
                    onClick = {
                        () => alert(`Badge: ${b}`) } >
                    { b } <
                    /span>
                ))
        } <
        /div> <
        /div>

        { /* USER CREATION */ } <
        div style = {
            { marginBottom: 12 } } >
        <
        input placeholder = "Username"
        value = { username }
        onChange = {
            (e) => setUsername(e.target.value) }
        /> <
        button onClick = { createUser } > Create User < /button> <
        button onClick = { fetchUserProfile } > Load Profile < /button> <
        /div>

        { /* LEVEL SELECTION */ } <
        div >
        <
        h2 > Level: { level } < /h2> <
        button onClick = {
            () => handleLevelChange("beginner") } > Beginner < /button> <
        button onClick = {
            () => handleLevelChange("intermediate") } > Intermediate < /button> <
        button onClick = {
            () => handleLevelChange("advanced") } > Advanced < /button> <
        /div>

        { /* EXERCISE SELECTION */ } <
        h3 > Select Exercises You CAN Do < /h3> <
        div > {
            workouts.map((w) => ( <
                label key = { w.id } >
                <
                input type = "checkbox"
                checked = { allowedExercises.includes(w.id) }
                onChange = {
                    () => toggleAllowedExercise(w.id) }
                /> { w.name }({ w.difficulty }) <
                /label>
            ))
        } <
        /div>

        { /* WORKOUT RECOMMENDATIONS */ } <
        h3 > Workout Recommendations < /h3> {
            workouts.filter((w) => allowedExercises.includes(w.id)).length === 0 && ( <
                p > No exercises selected— pick ones above. < /p>
            )
        } {
            workouts
                .filter((w) => allowedExercises.includes(w.id))
                .map((w) => ( <
                    div key = { w.id }
                    className = "workout-item" >
                    <
                    div >
                    <
                    strong > { w.name } < /strong> ({w.difficulty}) <
                    /div> <
                    button onClick = {
                        () => completeWorkout(w) } > Complete✅ < /button> <
                    button onClick = {
                        () => getGuidance(w) } > Guidance🛈 < /button> <
                    label >
                    <
                    input type = "checkbox"
                    checked = { selectedExercises.includes(w.id) }
                    onChange = {
                        () => toggleSelectedExercise(w.id) }
                    />
                    Add to routine <
                    /label> <
                    /div>
                ))
        }

        <
        p className = "guidance" > { guidanceText } < /p>

        { /* PROGRESS CHART */ } <
        h3 > Progress Chart < /h3> { progress.length > 0 ? < Line data = { chartData }
            /> : <p>No workouts completed yet.</p > }

        { /* QA SECTION */ } <
        h3 > Ask a Fitness Question < /h3> <
        input placeholder = "Type question..."
        value = { question }
        onChange = {
            (e) => setQuestion(e.target.value) }
        /> <
        button onClick = { postQuestion } > Ask < /button> <
        div >
        <
        strong > Predefined Questions: < /strong> {
            predefinedQA.map((q) => ( <
                button key = { q.id }
                onClick = {
                    () => setQuestion(q.question) } > { q.question } <
                /button>
            ))
        } <
        /div>

        { /* ROUTINE SAVE */ } <
        h3 > Save Custom Routine < /h3> <
        button onClick = { saveRoutine } > Save Routine < /button> <
        /div>
    );
}

export default App;