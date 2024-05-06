
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
const filterCountOfServiceDataByOptAndCat = (data) => {
    const result = {};
    const rowSums = {};
    const colSums = {};

    data.forEach(entry => {
        const { operator_name, category_name } = entry;
        if (!result[category_name]) {
            result[category_name] = {};
        }
        if (!result[category_name][operator_name]) {
            result[category_name][operator_name] = 1;
        } else {
            result[category_name][operator_name]++;
        }

        // Calculate column sums
        colSums[operator_name] = (colSums[operator_name] || 0) + 1;
    });

    // Calculate row sums and sort categories by row sums
    for (const category in result) {
        let rowSum = 0;
        for (const operator in result[category]) {
            rowSum += result[category][operator];
        }
        rowSums[category] = rowSum;
    }

    const sortedCategories = Object.keys(result).sort((a, b) => rowSums[b] - rowSums[a]);

    // Sort operators within each category by count
    sortedCategories.forEach(category => {
        result[category] = Object.fromEntries(
            Object.entries(result[category]).sort(([, aCount], [, bCount]) => bCount - aCount)
        );
    });

    // Rebuild the result object with sorted categories
    const sortedResult = {};
    sortedCategories.forEach(category => {
        sortedResult[category] = result[category];
    });

    return { result: sortedResult, rowSums, colSums };
}
const filterAvgOfServiceDataByOptAndCat = (data) => {
    const result = {};
    const rowAverages = {};
    const colAverages = {};

    data.forEach(entry => {
        const { operator_name, category_name, service_time_seconds } = entry;
        if (!result[category_name]) {
            result[category_name] = {};
        }
        if (!result[category_name][operator_name]) {
            result[category_name][operator_name] = { totalTime: service_time_seconds, count: 1 };
        } else {
            result[category_name][operator_name].totalTime += service_time_seconds;
            result[category_name][operator_name].count++;
        }

        // Calculate column sums
        if (service_time_seconds > 0) {
            colAverages[operator_name] = (colAverages[operator_name] || { totalTime: 0, count: 0 });
            colAverages[operator_name].totalTime += service_time_seconds;
            colAverages[operator_name].count++;
        }
    });

    // Calculate row and column averages
    for (const category in result) {
        let categoryTotalTime = 0;
        let categoryCount = 0;
        for (const operator in result[category]) {
            const { totalTime, count } = result[category][operator];
            const averageTime = totalTime / count;
            result[category][operator].averageTime = averageTime;
            categoryTotalTime += totalTime;
            categoryCount += count;

            // Update column averages
            if (totalTime > 0) {
                colAverages[operator].averageTime = (colAverages[operator].totalTime / colAverages[operator].count);
            }
        }
        // Update row averages
        rowAverages[category] = categoryTotalTime / categoryCount;
    }

    return { result, rowAverages, colAverages };
}
const populateAvgOfServiceByOptAndCatTable = (data) => {
    const { result, rowAverages, colAverages } = filterAvgOfServiceDataByOptAndCat(data);
    const categories = Object.keys(result);
    const operators = Object.keys(colAverages);

    let tableHTML = '<table class="table table-sm table-bordered align-middle text-center count-of-service-table">';
    tableHTML += '<tr><th>Category</th>';

    // Render table header with operator names
    operators.forEach(operator => {
        tableHTML += `<th>${operator}</th>`;
    });
    tableHTML += '<th>Total</th></tr>';

    // Render table body with category names, data, and row averages
    categories.forEach(category => {
        tableHTML += `<tr><th>${category}</th>`;
        let rowTotalTime = 0;
        let rowCount = 0;
        operators.forEach(operator => {
            const cellData = result[category][operator];
            if (cellData) {
                const seconds = Math.round(cellData.averageTime);
                tableHTML += `<td>${secondsToTimeString(seconds)}</td>`;
                rowTotalTime += cellData.totalTime;
                rowCount += cellData.count;
            } else {
                tableHTML += '<td></td>';
            }
        });
        const rowAverage = rowCount > 0 ? Math.round(rowTotalTime / rowCount) : 0;
        tableHTML += `<td>${secondsToTimeString(rowAverage)}</td></tr>`;
    });

    // Render table footer with column averages
    tableHTML += '<tr><th>Total</th>';
    let overallColumnTotalTime = 0;
    let overallColumnCount = 0;
    operators.forEach(operator => {
        const seconds = colAverages[operator].averageTime;
        const { cls } = getAvgServiceTimeBenchmarkColor(seconds);
        tableHTML += `<th class="${cls}">${secondsToTimeString(seconds)}</th>`;
        overallColumnTotalTime += colAverages[operator].totalTime;
        overallColumnCount += colAverages[operator].count;
    });
    const overallColumnAverage = overallColumnCount > 0 ? Math.round(overallColumnTotalTime / overallColumnCount) : 0;
    const { cls } = getAvgServiceTimeBenchmarkColor(overallColumnAverage);
    tableHTML += `<th class="${cls}">${secondsToTimeString(overallColumnAverage)}</th></tr>`;

    // Render the overall row average
    let overallRowTotalTime = 0;
    let overallRowCount = 0;
    categories.forEach(category => {
        const { totalTime, count } = rowAverages[category];
        overallRowTotalTime += totalTime;
        overallRowCount += count;
    });


    tableHTML += '</table>';
    $('#avgOfServiceByOptAndCat_Result').html(tableHTML);
}
const populateCountOfServiceTable = (data) => {
    const { result, rowSums, colSums } = filterCountOfServiceDataByOptAndCat(data);
    const operatorNames = Object.keys(colSums);

    let tableHTML = '<table class="table table-sm table-bordered align-middle text-center count-of-service-table">';
    tableHTML += '<tr><th>Category</th>';

    // Render table header
    operatorNames.forEach(operator => {
        tableHTML += `<th>${operator}</th>`;
    });
    tableHTML += '<th>Total</th></tr>';

    // Render table body
    for (const category in result) {
        tableHTML += `<tr><th>${category}</th>`;
        let rowSum = 0;
        operatorNames.forEach(operator => {
            const count = result[category][operator] || 0;
            tableHTML += `<td>${count}</td>`;
            rowSum += count;
        });
        tableHTML += `<th>${rowSum}</th></tr>`;
    }

    // Render column sums
    tableHTML += '<tr><th>Total</th>';
    let totalColSum = 0;
    operatorNames.forEach(operator => {
        const colSum = colSums[operator] || 0;
        tableHTML += `<th>${colSum}</th>`;
        totalColSum += colSum;
    });
    tableHTML += `<th>${totalColSum}</th></tr>`;

    tableHTML += '</table>';

    $('#countOfService_Result').html(tableHTML);
}
const calcAvgOfServiceByOperators = (data) => {
    const operators = data.map(x => x.operator_name);
    const uniqueOperators = getUniuqeItemsFromArray(operators);

    const result = [];
    uniqueOperators.forEach(operator => {
        const filteredDataByOperator = data.filter(x => x.operator_name == operator);
        const serviceTimeSeconds = filteredDataByOperator.map(x => x.service_time_seconds).filter(x => x > 0);
        const serviceCount = serviceTimeSeconds.length;

        const avg = Math.floor(calcArrayAvg(serviceTimeSeconds));
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
const populateAvgOfServiceTable = (data) => {
    const { totalServiceTime, totalServiceTimeAvg, totalServiceCount, result } = calcAvgOfServiceByOperators(data);

    const tbody = $('#avgOfServiceTable').find('tbody');
    const tfoot = $('#avgOfServiceTable').find('tfoot');

    tbody.empty();


    result.forEach(entry => {
        const { operator, serviceCount, avgInSeconds, avgHumanize, avgMoreReadable } = entry;

        const { cls } = getAvgServiceTimeBenchmarkColor(avgInSeconds);

        const tr = $('<tr></tr>');

        tr.append($('<td></td>').html(operator));
        tr.append(
            $('<td></td>').html(avgHumanize)
                .attr('data-bs-toggle', 'tooltip')
                .attr('data-bs-placement', 'top')
                .attr('title', secondsToReadableTime(avgInSeconds))
                .attr('class', cls)
        );

        tbody.append(tr);
    });

    tfoot.find('th:nth-child(2)').html(secondsToTimeString(totalServiceTimeAvg));
}
const calcAvgOfWaitByOperators = (data) => {
    const operators = data.map(x => x.operator_name);
    const uniqueOperators = getUniuqeItemsFromArray(operators);

    const result = [];
    uniqueOperators.forEach(operator => {
        const filteredDataByOperator = data.filter(x => x.operator_name == operator);
        const waitTimeSeconds = filteredDataByOperator.map(x => x.wait_time_seconds).filter(x => x > 0);
        const waitCount = waitTimeSeconds.length;

        const avg = Math.floor(calcArrayAvg(waitTimeSeconds));
        result.push({
            operator,
            waitCount,
            avgInSeconds: avg,
            avgHumanize: secondsToTimeString(avg),
            avgMoreReadable: secondsToReadableTime(avg)
        });
    });
    result.sort((a, b) => a.avgInSeconds - b.avgInSeconds);

    const totalWaitTime = arraySum(result.map(x => x.avgInSeconds));
    const totalWaitTimeAvg = Math.round(totalWaitTime / uniqueOperators.length);
    const totalWaitCount = arraySum(result.map(x => x.serviceCount));

    return { totalWaitTime, totalWaitTimeAvg, totalWaitCount, result };
}
const populateAvgOfWaitTable = (data) => {
    const { totalWaitTime, totalWaitTimeAvg, totalWaitCount, result } = calcAvgOfWaitByOperators(data);

    const tbody = $('#avgOfWaitTable').find('tbody');
    const tfoot = $('#avgOfWaitTable').find('tfoot');

    tbody.empty();

    result.forEach(entry => {
        const { operator, waitCount, avgInSeconds, avgHumanize, avgMoreReadable } = entry;

        const { cls } = getAvgServiceTimeBenchmarkColor(avgInSeconds);

        const tr = $('<tr></tr>');

        tr.append($('<td></td>').html(operator));
        tr.append($('<td></td>').html(waitCount));
        tr.append(
            $('<td></td>').html(avgHumanize)
                .attr('data-bs-toggle', 'tooltip')
                .attr('data-bs-placement', 'top')
                .attr('title', secondsToReadableTime(avgInSeconds))
        );

        tbody.append(tr);
    });

    tfoot.find('th:nth-child(2)').html(totalWaitCount);
    tfoot.find('th:nth-child(3)').html(secondsToTimeString(totalWaitTimeAvg));
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

const populateAvgOfWaitSection = () => {
    populateFiltersTable('avgOfWait', '#avgOfWait_Table', (data) => {
        populateAvgOfWaitTable(data);
    });
}
const populateCountOfServiceSection = () => {
    populateFiltersTable('countOfService', '#countOfService_Table', (data) => {
        populateCountOfServiceTable(data);
    });
}
const populateAvgOfServiceSection = () => {
    // average of service by operators
    populateFiltersTable('avgOfService', '#avgOfService_Table', (data) => {
        populateAvgOfServiceTable(data);
    });

    // average of service by operators and categories
    populateFiltersTable('avgOfServiceByOptAndCat', '#avgOfServiceByOptAndCat_Table', (data) => {
        populateAvgOfServiceByOptAndCatTable(data);
    });
}
const populateSections = () => {
    populateAvgOfServiceSection();
    populateCountOfServiceSection();
    populateAvgOfWaitSection();
}
const handleParsedData = (parsedData) => {
    const convertedData = convertParsedDataToArrayOfObjects(parsedData);
    const data = [];

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

    GLOBAL_STATE.data = data;

    const uniqueCounters = getUniqueCounters(data)
    const uniqueCategories = getUniqueCategories(data);
    const uniqueOperators = getUniqueOperators(data);

    GLOBAL_STATE.counters = uniqueCounters;
    GLOBAL_STATE.categories = uniqueCategories;
    GLOBAL_STATE.operators = uniqueOperators;

    populateSections();

    setTimeout(() => {
        $.LoadingOverlay('hide');
    }, 500);
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
    setTimeout(() => {
        Papa.parse(file, {
            complete: function (results) {
                const data = results.data;
                handleParsedData(data);
            },
            error: function (error) {
                $.LoadingOverlay('hide');
                alert(error.message);
            }
        });
    }, 500);
}
$('#fileInput').on('change', handleFileChange);
$('#btnSubmit').on('click', handleClickSubmit);