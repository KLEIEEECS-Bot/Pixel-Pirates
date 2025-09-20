import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import confetti from "canvas-confetti";
import "./App.css";

function App() {
    const [username, setUsername] = useState("");
    const [level, setLevel] = useState("beginner");
    const [workouts, setWorkouts] = useState([]);
    const [progress, setProgress] = useState([]);
    const [guidanceText, setGuidanceText] = useState("");
    const [question, setQuestion] = useState("");
    const [qaList, setQaList] = useState([]);
    const [selectedExercises, setSelectedExercises] = useState([]);

    // Create user
    const createUser = async() => {
        if (!username) return alert("Enter username!");
        try {
            await axios.post("http://localhost:5000/api/users", { username });
            alert("User Created!");
            fetchWorkouts();
        } catch (error) {
            console.error(error);
            alert("Error creating user");
        }
    };

    // Fetch workouts based on level
    const fetchWorkouts = async() => {
        try {
            const res = await axios.get(`http://localhost:5000/api/workouts/${level}`);
            setWorkouts(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Get guidance for an exercise
    const getGuidance = async(exercise) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/guidance/${exercise}`);
            setGuidanceText(`${exercise}: ${res.data.guidance}`);
        } catch (error) {
            console.error(error);
        }
    };

    // Complete a workout
    const completeWorkout = async(workout) => {
        try {
            const res = await axios.post("http://localhost:5000/api/progress", { username, workout });
            setProgress(res.data.user.progress);
            alert("Workout Completed! Level: " + res.data.user.level);

            // Confetti on every 3 workouts
            if (res.data.user.progress.length % 3 === 0) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Post a question
    const postQuestion = async() => {
        if (!question) return;
        try {
            const res = await axios.post("http://localhost:5000/api/qa", { username, question });
            alert("Answer: " + res.data.answer);
            setQuestion("");
            fetchQA();
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch Q&A
    const fetchQA = async() => {
        try {
            const res = await axios.get("http://localhost:5000/api/qa");
            setQaList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // Save custom routine
    const saveRoutine = async() => {
        try {
            await axios.post("http://localhost:5000/api/routine", { username, exercises: selectedExercises });
            alert("Custom routine saved!");
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch workouts and Q&A on mount
    useEffect(() => { fetchWorkouts(); }, [level]);
    useEffect(() => { fetchQA(); }, []);

    // Chart data
    const chartData = {
        labels: progress.map(p => new Date(p.date).toLocaleDateString()),
        datasets: [{
            label: "Workouts Completed",
            data: progress.map((_, i) => i + 1),
            borderColor: "green",
            fill: false,
        }],
    };

    return ( <
        div className = "app-container" >
        <
        h1 > 🎮FitQuest < /h1>

        { /* User Creation */ } <
        div >
        <
        input placeholder = "Username"
        value = { username }
        onChange = { e => setUsername(e.target.value) }
        /> <
        button onClick = { createUser } > Create User < /button> <
        /div>

        { /* Level Selection */ } <
        div >
        <
        h2 > Level: { level } < /h2> <
        button onClick = {
            () => setLevel("beginner") } > Beginner < /button> <
        button onClick = {
            () => setLevel("intermediate") } > Intermediate < /button> <
        button onClick = {
            () => setLevel("advanced") } > Advanced < /button> <
        /div>

        { /* Workouts */ } <
        h3 > Workout Recommendations < /h3> {
            workouts.map(w => ( <
                div key = { w }
                className = "workout-item" > { w } <
                button onClick = {
                    () => completeWorkout(w) } > Complete✅ < /button> <
                button onClick = {
                    () => getGuidance(w) } > Guidance🛈 < /button> <
                /div>
            ))
        } <
        p className = "guidance" > { guidanceText } < /p>

        { /* Progress Chart */ } <
        h3 > Progress Chart < /h3> { progress.length > 0 ? < Line data = { chartData }
            /> : <p>No workouts completed yet.</p > }

        { /* Achievements */ } <
        h3 > Achievements < /h3> {
            progress.length > 0 && ( <
                div > {
                    progress.map((_, i) =>
                        (i + 1) % 5 === 0 ? ( <
                            span key = { i }
                            className = "badge"
                            onClick = {
                                () => alert(`You earned a badge for ${i + 1} workouts! 🎉`) } >
                            🏅
                            <
                            /span>
                        ) : null
                    )
                } <
                /div>
            )
        }

        { /* Q&A */ } <
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
                b > { qa.username }: < /b> {qa.question} <br / >
                <
                i > Answer: { qa.answer } < /i> <
                /div>
            ))
        }

        { /* Custom Routine */ } <
        h3 > Build Your Custom Routine < /h3> {
            workouts.map(w => ( <
                div key = { w } >
                <
                input type = "checkbox"
                value = { w }
                onChange = {
                    e => {
                        const checked = e.target.checked;
                        setSelectedExercises(prev =>
                            checked ? [...prev, w] : prev.filter(x => x !== w)
                        );
                    }
                }
                /> {w} <
                /div>
            ))
        } <
        button onClick = { saveRoutine } > Save Routine✅ < /button> <
        /div>
    );
}

export default App;