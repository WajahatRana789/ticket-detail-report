const GLOBAL_STATE = {
    data: [],
    counters: [],
    categories: [],
    operators: []
}

const averageOfServiceChartDOM = document.getElementById('averageOfServiceChart');
const averageOfServiceChartCtx = echarts.init(averageOfServiceChartDOM);

const getAvgServiceTimeGraphOptions = (yAxis, series) => {
    const options = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function (params) {
                const param = params[0];
                const { value, name, marker } = param;
                let str = '<div class="d-flex align-items-center">';

                str += '<div>';
                str += marker;
                str += '<span>' + name + '</span>';
                str += '</div>';

                str += '<div class="ms-4"><b>' + secondsToTimeString(value) + '</b></div>'
                str += '</div>';

                return str;
            }
        },
        legend: {},
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            show: false
        },
        yAxis: {
            type: 'category',
            data: yAxis
        },
        series: [
            {
                data: series,
                type: 'bar'
            }
        ]
    };
    return options;
}
const showError = (title, content) => {
    $.alert({ title, content, type: 'red' });
}
const resetFileUpload = () => {
    $('#fileInput').val('');
    $('#filename').html('');
    $('#fileErrorText').html('');
    $('#btnSubmit').hide();
}
const timeToSeconds = (timeString) => {
    if (!timeString) {
        return 0;
    }
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}
const secondsToTimeString = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

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
const calcArrayAverage = (array) => {
    const sum = array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    return sum / array.length;
}
const getUniuqeItemsFromArray = (array) => {
    return Array.from(new Set(array));
}

const getAvgServiceTimeBenchmarkColor = (seconds) => {
    let cls = 'bad';
    let color = 'rgba(234, 84, 85, 1)';

    if (seconds <= 110) {
        cls = 'good';
        color = 'rgba(40, 199, 111, 1)';
    }
    if (seconds > 110 && seconds <= 165) {
        cls = 'normal';
        color = 'rgba(255, 159, 67, 1)';
    }
    if (seconds > 165) {
        cls = 'bad';
        color = 'rgba(234, 84, 85, 1)';
    }
    return { cls, color };
}
const populateAverageOfServiceChart = (data) => {
    data.sort((a, b) => b.avgInSeconds - a.avgInSeconds);
    const yAxis = data.map(x => x.operator);

    const series = [];
    data.forEach(entry => {
        const { avgInSeconds } = entry;
        const { color } = getAvgServiceTimeBenchmarkColor(avgInSeconds);

        series.push({
            value: avgInSeconds,
            itemStyle: { color }
        });
    });

    const options = getAvgServiceTimeGraphOptions(yAxis, series);
    averageOfServiceChartCtx.setOption(options);
    setTimeout(() => {
        averageOfServiceChartCtx.resize();
    }, 100);
}
const populateAverageOfServiceTable = (totalServiceTime, totalServiceTimeAvg, totalServiceCount, data) => {
    const tbody = $('#averageOfServiceTable').find('tbody');
    const tfoot = $('#averageOfServiceTable').find('tfoot');

    tbody.empty();


    data.forEach(entry => {
        const { operator, serviceCount, avgInSeconds, avgHumanize, avgMoreReadable } = entry;

        const { cls } = getAvgServiceTimeBenchmarkColor(avgInSeconds);

        const tr = $('<tr></tr>');
        tr.attr('class', cls);

        tr.append($('<td></td>').html(operator));
        tr.append($('<td></td>').html(serviceCount));
        tr.append(
            $('<td></td>').html(avgHumanize)
                .attr('data-bs-toggle', 'tooltip')
                .attr('data-bs-placement', 'top')
                .attr('title', secondsToReadableTime(avgInSeconds))
        );

        tbody.append(tr);
    });

    tfoot.find('th:nth-child(2)').html(totalServiceCount);
    tfoot.find('th:nth-child(3)').html(secondsToTimeString(totalServiceTimeAvg));

    populateAverageOfServiceChart(data);

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
}
const calcAverageOfServiceByOperators = (data) => {
    const operators = data.map(x => x.operator_name);
    const uniqueOperators = getUniuqeItemsFromArray(operators);

    const result = [];
    uniqueOperators.forEach(operator => {
        const filteredDataByOperator = data.filter(x => x.operator_name == operator);
        const serviceTimeSeconds = filteredDataByOperator.map(x => x.service_time_seconds).filter(x => x > 0);
        const serviceCount = serviceTimeSeconds.length;

        const avg = Math.floor(calcArrayAverage(serviceTimeSeconds));
        result.push({
            operator,
            serviceCount,
            avgInSeconds: avg,
            avgHumanize: secondsToTimeString(avg),
            avgMoreReadable: secondsToReadableTime(avg)
        });
    });
    result.sort((a, b) => a.avgInSeconds - b.avgInSeconds);

    const totalServiceTime = arraySum(result.map(x => x.avgInSeconds));
    const totalServiceTimeAvg = Math.round(totalServiceTime / uniqueOperators.length);
    const totalServiceCount = arraySum(result.map(x => x.serviceCount));

    return { totalServiceTime, totalServiceTimeAvg, totalServiceCount, result };
}
const convertParsedDataToArrayOfObjects = (parsedData) => {
    const headers = parsedData[0].map(header => header.toLowerCase().replace(/\s+/g, '_'));
    const data = parsedData.slice(1, parsedData.length - 1);

    const arrayOfObjects = data.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });

    return arrayOfObjects;
}
const createCheckbox = (id, name, value, text) => {
    const container = $('<div></div>');
    container.attr('class', 'form-check');

    const checkbox = $('<input/>');
    checkbox.attr('class', 'form-check-input');
    checkbox.attr('type', 'checkbox');
    checkbox.val(value);
    checkbox.attr('id', id);
    checkbox.attr('name', name);
    checkbox.prop('checked', true);

    const label = $('<label></label>');
    label.attr('for', id);


    const span = $('<span></span>');
    span.attr('class', 'form-check-label');
    span.html(text);

    container.append(checkbox).append(label).append(span);
    return container;
}
const renderFilter = (data, key, elemId) => {

    $('#' + elemId).empty();
    data.forEach((el, index) => {
        const id = key + '-' + index;
        const checkbox = createCheckbox(id, key, el, el);
        $('#' + elemId).append(checkbox);
    });
}
const renderFilters = () => {
    const counters = GLOBAL_STATE.counters;
    const categories = GLOBAL_STATE.categories;

    renderFilter(counters, 'counter', 'countersFilter');
    renderFilter(categories, 'category', 'categoriesFilter');
}
const handleParsedData = (parsedData) => {
    const convertedData = convertParsedDataToArrayOfObjects(parsedData);
    const data = [];

    // if (data.length <= 0) {
    //     $.LoadingOverlay('hide');
    //     resetFileUpload();
    //     showError('Error', "Oops! It appears that the data is empty or there was an error parsing it. Please ensure you have uploaded a valid CSV file. If you're sure it's a CSV file and everything seems fine, please reach out to the developer for assistance.");
    //     return;
    // }

    convertedData.forEach(entry => {
        const { operator_name, category_name, service_time, wait_time, counter_id } = entry;
        const obj = {
            operator_name: operator_name,
            counter_id: counter_id,
            category_name: category_name,
            service_time: service_time,
            service_time_seconds: timeToSeconds(service_time),
            wait_time: wait_time,
            wait_time_seconds: timeToSeconds(wait_time)
        }
        data.push(obj);
    });


    $.LoadingOverlay('hide');
    $('#fileUploadContainer').hide();
    $('#resultContainer').show();

    GLOBAL_STATE.data = data;

    const counters = data.map(x => x.counter_id);
    const uniqueCounters = getUniuqeItemsFromArray(counters);
    uniqueCounters.sort((a, b) => a.localeCompare(b));

    const categories = data.map(x => x.category_name);
    const uniqueCategories = getUniuqeItemsFromArray(categories);
    uniqueCategories.sort((a, b) => a.localeCompare(b));

    const operators = data.map(x => x.operator_name);
    const uniqueOperators = getUniuqeItemsFromArray(operators);


    GLOBAL_STATE.counters = uniqueCounters;
    GLOBAL_STATE.categories = uniqueCategories;
    GLOBAL_STATE.operators = uniqueOperators;

    renderFilters();

    const { totalServiceTime, totalServiceTimeAvg, totalServiceCount, result } = calcAverageOfServiceByOperators(data);
    populateAverageOfServiceTable(totalServiceTime, totalServiceTimeAvg, totalServiceCount, result);
}
const handleFileChange = (e) => {
    const input = e.currentTarget;
    const file = input.files[0];
    const filename = file.name;

    $('#fileErrorText').html('');
    $('#filename').html(filename).removeClass('text-danger');

    let extension = filename.split('.').pop();
    if (extension && typeof extension === 'string') {
        extension = extension.toLowerCase();
    }

    if (extension !== 'csv') {
        $('#filename').html('');
        $('#fileErrorText').html('Invalid file extension. Please upload a .csv file.');
        return;
    }

    $('#btnSubmit').show();
}

const handleClickSubmit = () => {
    const file = $('#fileInput')[0].files[0];
    if (!file) {
        showError('Error', 'Please select a file');
        return;
    }
    const filename = file.name;
    let extension = filename.split('.').pop();
    if (extension && typeof extension === 'string') {
        extension = extension.toLowerCase();
    }

    if (extension !== 'csv') {
        $('#filename').html('');
        showError('Error', 'Invalid file extension. Please upload a .csv file.');
        return;
    }

    $('#btnSubmit').show();
    $.LoadingOverlay('show');
    Papa.parse(file, {
        complete: function (results) {
            resetFileUpload();
            const data = results.data;
            handleParsedData(data);
        },
        error: function (error) {
            $.LoadingOverlay('hide');
            alert(error.message);
        }
    });
}
const getSelectedFilters = (key) => {
    const values = [];
    $(`[name="${key}"]:checked`).toArray().forEach(el => {
        values.push($(el).val());
    });
    return values;
}
const handleClickApplyFilters = () => {
    const data = GLOBAL_STATE.data;

    const selectedCounters = getSelectedFilters('counter');
    const selectedCategories = getSelectedFilters('category');

    const filteredData = data.filter(item =>
        selectedCounters.includes(item.counter_id) &&
        selectedCategories.includes(item.category_name)
    );

    const { totalServiceTime, totalServiceTimeAvg, totalServiceCount, result } = calcAverageOfServiceByOperators(filteredData);
    populateAverageOfServiceTable(totalServiceTime, totalServiceTimeAvg, totalServiceCount, result);

}

$('#fileInput').on('change', handleFileChange);
$('#btnSubmit').on('click', handleClickSubmit);
$('#btnApplyFilters').on('click', handleClickApplyFilters);