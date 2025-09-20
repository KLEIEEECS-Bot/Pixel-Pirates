import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import './App.css'; // For gamification styles

function App() {
    const [username, setUsername] = useState("");
    const [level, setLevel] = useState("beginner");
    const [workouts, setWorkouts] = useState([]);
    const [progress, setProgress] = useState([]);
    const [guidanceText, setGuidanceText] = useState("");
    const [question, setQuestion] = useState("");
    const [qaList, setQaList] = useState([]);

    const createUser = async() => {
        if (!username) return alert("Enter username!");
        await axios.post("http://localhost:5000/api/users", { username });
        alert("User Created!");
        fetchWorkouts();
    }

    const fetchWorkouts = async() => {
        const res = await axios.get(`http://localhost:5000/api/workouts/${level}`);
        setWorkouts(res.data);
    }

    const getGuidance = async(exercise) => {
        const res = await axios.get(`http://localhost:5000/api/guidance/${exercise}`);
        setGuidanceText(`${exercise}: ${res.data.guidance}`);
    }

    const completeWorkout = async(workout) => {
        const res = await axios.post("http://localhost:5000/api/progress", { username, workout });
        setProgress(res.data.user.progress);
        alert("Workout Completed! Level: " + res.data.user.level);
    }

    const postQuestion = async() => {
        if (!question) return;
        const res = await axios.post("http://localhost:5000/api/qa", { username, question });
        alert("Answer: " + res.data.answer);
        setQuestion("");
        fetchQA();
    }

    const fetchQA = async() => {
        const res = await axios.get("http://localhost:5000/api/qa");
        setQaList(res.data);
    }

    useEffect(() => { fetchWorkouts(); }, [level]);
    useEffect(() => { fetchQA(); }, []);

    const chartData = {
        labels: progress.map(p => new Date(p.date).toLocaleDateString()),
        datasets: [{ label: "Workouts Completed", data: progress.map((_, i) => i + 1), borderColor: "green", fill: false }]
    };

    return ( <
            div className = "app-container" >
            <
            h1 > 🎮FitQuest < /h1> <
            div >
            <
            input placeholder = "Username"
            value = { username }
            onChange = { e => setUsername(e.target.value) }
            /> <
            button onClick = { createUser } > Create User < /button> < /
            div >

            <
            div >
            <
            h2 > Level: { level } < /h2> <
            button onClick = {
                () => setLevel("beginner")
            } > Beginner < /button> <
            button onClick = {
                () => setLevel("intermediate")
            } > Intermediate < /button> <
            button onClick = {
                () => setLevel("advanced")
            } > Advanced < /button> < /
            div >

            <
            h3 > Workout Recommendations < /h3> {
            workouts.map(w => ( <
                div key = { w }
                className = "workout-item" > { w } <
                button onClick = {
                    () => completeWorkout(w)
                } > Complete✅ < /button> <
                button onClick = {
                    () => getGuidance(w)
                } > Guidance🛈 < /button> < /
                div >
            ))
        } <
        p className = "guidance" > { guidanceText } < /p>

    <
    h3 > Progress Chart < /h3> <
    Line data = { chartData }
    />

    <
    h3 > Ask a Question < /h3> <
    input placeholder = "Type your question"
    value = { question }
    onChange = { e => setQuestion(e.target.value) }
    /> <
    button onClick = { postQuestion } > Ask < /button>

    <
    h3 > Previous Q & A < /h3> {
    qaList.map((qa, i) => ( <
        div key = { i }
        className = "qa-item" >
        <
        b > { qa.username }: < /b> {qa.question} <br/ >
        <
        i > Answer: { qa.answer } < /i> < /
        div >
    ))
} <
/div>
)
}

export default App;

import confetti from 'canvas-confetti';

// Inside completeWorkout function
const completeWorkout = async(workout) => {
    const res = await axios.post("http://localhost:5000/api/progress", { username, workout });
    setProgress(res.data.user.progress);
    alert("Workout Completed! Level: " + res.data.user.level);

    // Trigger confetti if level increased
    if (res.data.user.progress.length % 3 === 0) {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
};