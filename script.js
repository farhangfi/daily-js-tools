// ۱. انتخاب المان‌های HTML از طریق ID آن‌ها
const number1Input = document.getElementById('num1');
const number2Input = document.getElementById('num2');
const calculateButton = document.getElementById('calcBtn');
const resultDiv = document.getElementById('result');
const stringResultDiv = document.getElementById('stringResult');

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

    // اگر هرکدام از کادرها خالی بود، مقدار پیش‌فرض نمایش داده شود
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