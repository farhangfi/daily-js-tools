// ۱. انتخاب المان‌های HTML از طریق ID آن‌ها
const number1Input = document.getElementById('num1');
const number2Input = document.getElementById('num2');
const calculateButton = document.getElementById('calcBtn');
const resultDiv = document.getElementById('result');
const stringResultDiv = document.getElementById('stringResult');
const showDiv = document.getElementById('show');

calculateButton.addEventListener('click', function() {
    const val1 = number1Input.value;
    const val2 = number2Input.value;

    if (val1 === '' || val2 === '') {
        resultDiv.innerText = "Please insert both number!";
        resultDiv.style.color = "red";
        return; 
    }

    const sum = Number(val1) + Number(val2);

    resultDiv.innerText = `Sum: ${sum}`;
    resultDiv.style.color = "green";
});

function calculate() {
    const val1 = number1Input.value;
    const val2 = number2Input.value;

    if (val1 === '' || val2 === '') {
        stringResultDiv.innerText = "String Sum";
        return; 
    }

    const stringSum = val1 + val2; 
    stringResultDiv.innerText = `String sum: ${stringSum}`;
}

function triggerPulse(element) {
    // Remove the class first if it already exists from a previous typing action
    element.classList.remove('animate__animated', 'animate__pulse');
    
    // Trigger reflow to restart the animation in the browser
    void element.offsetWidth; 
    
    // Add classes to start the animation
    element.classList.add('animate__animated', 'animate__pulse');
}

number1Input.addEventListener('input', calculate);
number2Input.addEventListener('input', calculate);



// Retrieve stored tasks from LocalStorage or initialize an empty array
let tasks = JSON.parse(localStorage.getItem('myTasks')) || [];

// Function to render all tasks onto the screen
function renderTasks() {
    todoList.innerHTML = ''; // Clear current list

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 animate__animated animate__fadeInUp';

        // Task Text
        const span = document.createElement('span');
        span.className = 'text-gray-700 text-sm font-medium break-all';
        span.textContent = task;

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 transition-colors';
        deleteBtn.textContent = 'Delete';
        
        // When delete is clicked, remove item from array and update Storage
        deleteBtn.addEventListener('click', () => {
            deleteTask(index);
        });

        li.appendChild(span);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
}

// Function to add a new task
function addTask() {
    const taskText = todoInput.value.trim();
    if (taskText === '') return;

    tasks.push(taskText); // Add to local array
    saveToLocalStorage(); // Update LocalStorage
    renderTasks();        // Refresh UI
    todoInput.value = ''; // Reset input field
}

// Function to delete a task
function deleteTask(index) {
    tasks.splice(index, 1); // Remove 1 element at the given index
    saveToLocalStorage();   // Update LocalStorage
    renderTasks();          // Refresh UI
}

// Helper function to save tasks array in LocalStorage
function saveToLocalStorage() {
    // LocalStorage only saves strings, so we must convert the array to JSON
    localStorage.setItem('myTasks', JSON.stringify(tasks));
}

// Event Listeners for Todo List
addTodoBtn.addEventListener('click', addTask);

// Allow adding task by pressing "Enter" key
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Initial render of tasks when the page loads
renderTasks();



function show() {
    showDiv.innerText =JSON.stringify(tasks);
}

show();