import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Todopage.css";
import { useNavigate } from "react-router-dom";

const Todopage = () => {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [userId, setUserId] = useState(null); // State for user_id
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(localStorage.getItem("token"));

    if (token) {
      console.log("Authorization Header:", `Bearer ${token}`);
      axios
        .get("http://localhost:4000/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          console.log("User Data:", response.data);
          if (response.data) {
            const user_id = response.data.user_id;
            console.log("Extracted user_id:", user_id);
            setUserId(user_id); // Set userId for further use
          } else {
            console.error("Invalid response structure: 'user' key missing");
          }
        })
        .catch((error) => {
          console.error("Error fetching user ID:", error);
          navigate("/login");
        });
    } else {
      console.log("No token found");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    // Ensure tasks are fetched only when userId is available
    console.log("userId value before useEffect:", userId);
    if (userId) {
      console.log("userId inside useEffect:", userId);
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found for tasks API.");
        navigate("/login");
        return;
      }
      console.log("Fetching tasks for userId:", userId); 
      // Fetch tasks for the specific user
      axios
        .get(`http://localhost:4000/tasks/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          console.log("Tasks fetched successfully:", response.data);
          if (Array.isArray(response.data)) {
            console.log("dats",response.data);
            setTasks(response.data); // Proceed with valid array data

          } else {
            console.error("Expected an array but received:", response.data);
            setTasks([]); // Fallback to an empty array if data is not as expected
          }
        })
        .catch((error) => {
          console.error("Error fetching tasks:", error);
          setTasks([]); // Fallback to an empty array in case of an error
        });
    }
  }, [userId, navigate]); // Trigger this effect when userId is set

  // Add a new task
  const addTask = () => {
    if (taskInput.trim() === "") return;

    const newTask = {
      text: taskInput, // Corrected key to match backend
      completed: false,
      user_id: userId, // Corrected key to match backend
    };

    const token = localStorage.getItem("token");
    console.log("Token:", token);
    axios
      .post("http://localhost:4000/tasks", newTask, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setTasks([...tasks, response.data]); // Add the new task to the list
        setTaskInput("");
      })
      .catch((error) => {
        console.error("Error adding task:", error.response?.data || error.message);
      });
  };

  // Toggle task completion
  const toggleTask = (taskId, currentStatus) => {
    const token = localStorage.getItem("token");

    axios
      .put(
        `http://localhost:4000/tasks/${taskId}`,
        { completed: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        setTasks(
          tasks.map((task) =>
            task.id === taskId ? { ...task, completed: response.data.completed } : task
          )
        );
      })
      .catch((error) => {
        console.error("Error toggling task:", error);
      });
  };

  // Delete a task
  const deleteTask = (taskId) => {
    const token = localStorage.getItem("token");
    axios
      .delete(`http://localhost:4000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== taskId)); // Remove deleted task from state
      })
      .catch((error) => {
        console.error("Error deleting task:", error);
      });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token from localStorage
    navigate("/login");
  };

  return (
    <div className="todo-container">
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
      <div className="todo-box">
        <h1 className="todo-title">To-Do List</h1>
        <div className="input-container">
          <input
            type="text"
            placeholder="Add your task..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            className="todo-input"
          />
          <button
            onClick={addTask}
            className="add-button"
            disabled={!userId || taskInput.trim() === ""}
          >
            Add
          </button>
        </div>
        <ul className="task-list">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`task-item ${task.completed ? "completed" : ""}`}
              onClick={() => toggleTask(task.id, task.completed)}
            >
              <div className={`circle ${task.completed ? "completed" : ""}`}>

                {task.completed && <span className="tick-mark">✔</span>}
              </div>
              <span className={`task-content ${task.completed ? "completed" : ""}`}>
                {task.text}
              </span>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
              >
                ✖
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Todopage;