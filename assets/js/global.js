const GLOBAL_STATE = {
    data: [],
    counters: [],
    categories: [],
    operators: [],
    filters: {}
}
const showError = (title, content) => {
    $.alert({ title, content, type: 'red' });
}
const timeToSeconds = (timeString) => {
    if (!timeString) {
        return 0;
    }
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}
const secondsToTimeString = (totalSeconds) => {
    let roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;

    const padZero = (num) => {
        return num < 10 ? '0' + num : num;
    };

    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
};
const secondsToReadableTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let timeString = '';

    if (hours > 0) {
        timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
        timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    }
    if (seconds > 0 || timeString === '') {
        timeString += `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    return timeString.trim();
};
const arraySum = (arr) => {
    return arr.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}
const calcArrayAvg = (array) => {
    const sum = array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return sum / array.length;
}
const getUniuqeItemsFromArray = (array) => {
    return Array.from(new Set(array));
}
const getUniqueCounters = (data) => {
    const counters = data.map(x => x.counter_id);
    const uniqueCounters = getUniuqeItemsFromArray(counters);
    uniqueCounters.sort((a, b) => a.localeCompare(b));
    return uniqueCounters;
}
const getUniqueCategories = (data) => {
    const categories = data.map(x => x.category_name);
    const uniqueCategories = getUniuqeItemsFromArray(categories);
    uniqueCategories.sort((a, b) => a.localeCompare(b));
    return uniqueCategories;
}
const getUniqueOperators = (data) => {
    const operators = data.map(x => x.operator_name);
    const uniqueOperators = getUniuqeItemsFromArray(operators);
    uniqueOperators.sort((a, b) => a.localeCompare(b));
    return uniqueOperators;
}