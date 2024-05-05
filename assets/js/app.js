const GLOBAL_STATE = {
    data: [],
    counters: [],
    categories: [],
    operators: [],
    filtersInfo: {
        avgOfService: {}
    },
    filters: {}
}

const avgOfServiceChartDOM = document.getElementById('avgOfServiceChart');
const avgOfServiceChartCtx = echarts.init(avgOfServiceChartDOM);

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
const populateAvgOfServiceChart = (data) => {
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
    avgOfServiceChartCtx.setOption(options);
    setTimeout(() => {
        avgOfServiceChartCtx.resize();
    }, 100);
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

    populateAvgOfServiceChart(result);

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
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
        tr.attr('class', cls);

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

    // populateAvgOfServiceChart(result);

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
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

const handleClickClearFilter = (tableId, columnName, columnText, list) => {

    if ($.fn.DataTable.isDataTable(tableId)) {

        setPopulateFiltersFlag(tableId, true);

        // show loading
        $.LoadingOverlay('show');



        const dt = $(tableId).DataTable();
        const columns = dt.settings().init().columns;

        if (Array.isArray(columns)) {
            const column = columns.find(column => column.name === columnName);
            if (column && typeof column === 'object') {
                column.filter.applied = true;
                column.filter.selected = [];
                columnSearch(dt, columnName, []);
            }
        }

        const filterIcon = $('#' + columnName + '_filterIcon');
        filterIcon.html('<i class="bx bx-filter"></i>').removeClass('text-primary');




        setTimeout(() => {
            dt.draw();
        }, 500);
        setTimeout(() => {
            $.LoadingOverlay('hide');
        }, 1000);


        // const count = removeAppliedFilterInfo(columnName);
        // renderAppledFiltersCount(tableId, count);

        // uncheck all checkbox
        const checkboxes = $(list).find('input[type=checkbox]');
        checkboxes.prop('checked', false);
    }
}
const handleClickApplyFilter = (tableId, columnName, columnText, list) => {
    if ($.fn.DataTable.isDataTable(tableId)) {

        setPopulateFiltersFlag(tableId, true);

        const dt = $(tableId).DataTable();
        const columns = dt.settings().init().columns;
        let dropdownColumns = [];
        if (Array.isArray(columns) && columns.length > 0) {
            dropdownColumns = columns.filter(column => column.filter.type === 'dropdown');
        }

        if (Array.isArray(dropdownColumns)) {
            dropdownColumns.filter(column => column.name !== columnName).forEach(column => {
                column.filter.applied = false;
            });
        }


        const selected = [];
        const checkboxes = $(list).find('input[type=checkbox]:checked').toArray();
        checkboxes.forEach(checkbox => {
            selected.push($(checkbox).val());
        });
        if (selected.length < 1) {
            // showToast('Error', 'please select at least one item', 6000, 'error', false);
            alert('Please select at least one item');
            return;
        }


        if (Array.isArray(columns)) {
            const column = columns.find(column => column.name === columnName);
            if (column && typeof column === 'object') {
                column.filter.applied = true;
                column.filter.selected = selected;
            }
        }



        // show loading
        $.LoadingOverlay('show');


        // add search string in column
        if (Array.isArray(dropdownColumns) && dropdownColumns.length > 0) {
            dropdownColumns.forEach(column => {
                const columnName = column.name;
                const filter = column.filter;
                let selected = [];
                if (filter && typeof filter === 'object') {
                    if (filter.hasOwnProperty('selected')) {
                        selected = filter.selected;
                    }
                }
                columnSearch(dt, columnName, selected);
            });
        }

        setTimeout(() => {
            dt.draw();
        }, 500);
        setTimeout(() => {
            $.LoadingOverlay('hide');
        }, 1000);

        // const count = storeAppliedFilterInfo(columnName, columnText, selected);
        // renderAppledFiltersCount(tableId, count);
    }
}
const creatFilterCard = (sectionId, tableId, column) => {

    const columnName = column.filter.columnName;
    const columnText = column.filter.columnText;


    const card = $('<div></div>');
    card.attr('class', 'filters-card');

    const header = $('<div></div>');
    header.attr('class', 'filters-card-header');

    const searchInput = $('<input/>');
    searchInput.attr('class', 'form-control form-control-sm');
    searchInput.attr('placeholder', 'Search ' + columnText);
    header.append(searchInput);

    const body = $('<div></div>');
    body.attr('class', 'filter-card-body');

    const list = $('<ul></ul>');
    body.append(list);

    const footer = $('<div></div>');
    footer.attr('class', 'filter-card-footer');

    const btnApply = $('<button></button>');
    btnApply.attr('class', 'btn btn-sm btn-primary');
    btnApply.html('Apply');
    btnApply.on('click', function () {
        handleClickApplyFilter(tableId, columnName, columnText, list);
    });

    const btnClear = $('<button></button>');
    btnClear.attr('class', 'btn btn-sm btn-secondary me-2');
    btnClear.html('Clear');
    btnClear.on('click', function () {
        handleClickClearFilter(tableId, key, text, list);
    });

    footer.append(btnClear).append(btnApply);

    card.append(header).append(body).append(footer);
    return card;
}
const createFilter = (sectionId, tableId, column) => {

    const columnName = column.filter.columnName;
    const columnText = column.filter.columnText;

    const filtersContainer = $('<div></div>');
    filtersContainer.attr('class', 'filters-container');
    const containerID = sectionId + '_' + columnName + '_filters_container';
    filtersContainer.attr('id', containerID);

    const filtersDropdown = $('<div></div>');
    filtersDropdown.attr('class', 'filters-dropdown form-control form-control-sm');
    filtersDropdown.append($('<span></span>').html(columnText));
    filtersDropdown.append($('<i class="bx bx-chevron-down"></i>'));

    filtersDropdown.on('click', () => {
        $(filtersContainer).toggleClass('show');
    });

    const filterCard = creatFilterCard(sectionId, tableId, column);


    filtersContainer.append(filtersDropdown).append(filterCard);
    return filtersContainer;
}
const createFilters = (sectionId, tableId) => {
    const dt = $(tableId).DataTable();

    const wrapper = $('<div></div>');
    wrapper.attr('class', 'filters-main-wrapper');
    wrapper.append($('<h5></h5>').html('<i class="bx bx-filter"></i><span>Filters</span>'));

    const columns = dt.settings().init().columns;

    // const dt = $(tableId).DataTable();
    // column.filter.selected = [];

    const dropdownColumns = columns.filter(column => column.filter.type === 'dropdown');
    dropdownColumns.forEach(column => {
        const columnData = dt.column(column.name + ':name').data().unique().sort().toArray();
        column.filter.selected = columnData;

        const filter = createFilter(sectionId, tableId, column);
        wrapper.append(filter);
    });
    $(tableId + '_FiltersContainer').html(wrapper);
}
const setPopulateFiltersFlag = (tableId, flag) => {
    if (!GLOBAL_STATE.filters.hasOwnProperty(tableId)) {
        GLOBAL_STATE.filters[tableId] = {};
    }
    GLOBAL_STATE.filters[tableId].shouldPopulateFilters = flag;
}
const getPopulateFiltersFlag = (tableId) => {
    let flag = true;
    if (GLOBAL_STATE.filters.hasOwnProperty(tableId)) {
        const obj = GLOBAL_STATE.filters[tableId];
        if (obj && typeof obj === 'object' && obj.hasOwnProperty('shouldPopulateFilters')) {
            flag = obj.shouldPopulateFilters;
        }
    }
    return flag;
}

const clearColumnSearchByName = (dt, columnName) => {
    dt.column(columnName + ':name').search('');
}
const columnSearch = (dt, columnName, values) => {
    let searchRegex = '';
    if (Array.isArray(values) && values.length > 0) {
        values.forEach((value, index) => {
            index == 0 ? searchRegex += '^' + $.fn.dataTable.util.escapeRegex(value) + '$' : searchRegex += '|^' + $.fn.dataTable.util.escapeRegex(value) + '$';
        });
        dt.column(columnName + ':name').search(searchRegex, true, false, false);
    } else {
        dt.column(columnName + ':name').search('');
    }
}
const createFilterCheckbox = (id, val, text, isChecked, onChange) => {

    const div = $('<div></div>');

    const checkbox = $('<input/>');
    checkbox.attr('type', 'checkbox');
    checkbox.attr('class', 'filter-checkbox');
    checkbox.attr('id', id);
    checkbox.val(val);
    checkbox.attr('data-val', val);
    checkbox.prop('checked', isChecked ? true : false);

    if (onChange && typeof onChange === 'function') {
        checkbox.on('change', onChange);
    }


    const label = $('<label></label>');
    label.attr('for', id);

    const span = $('<span></span>');
    span.html(text);


    div.append(checkbox).append(label).append(span);
    return div;
}
const populateDropdownFilters = (sectionId, tableId, dt, columns) => {
    if (Array.isArray(columns) && columns.length > 0) {
        columns.forEach(column => {
            const columnName = column.name;
            const filter = column.filter;
            const columnAllData = dt.column(columnName + ':name').data().unique().toArray();


            // context menu elements
            const filterIcon = $('#' + columnName + '_filterIcon');
            const filtersContainer = $('#' + sectionId + '_' + columnName + '_filters_container');
            const menuBody = filtersContainer.find('.filter-card-body')
            const columnRecordsInfo = $(menuBody).find('.column-records-info');
            const columnRecordsList = $(menuBody).find('ul');
            const columnRecordsSelectAllWrapper = $(menuBody).find('.column-records-select-all-wrapper');
            const columnRecordsSearchWrapper = $(menuBody).find('.column-records-search-wrapper');


            if (filter && typeof filter === 'object') {
                if (filter.hasOwnProperty('applied')) {
                    const applied = filter.applied;
                    if (!applied) {
                        clearColumnSearchByName(dt, columnName);


                        columns.filter(column => column.name !== columnName).forEach(column => {
                            const columnName = column.name;
                            const filter = column.filter;
                            if (filter && typeof filter === 'object') {
                                let selected = [];
                                if (filter.hasOwnProperty('selected')) {
                                    selected = filter.selected;
                                }
                                columnSearch(dt, columnName, selected);
                            }
                        });

                        const column = dt.column(columnName + ':name', { search: 'applied' });
                        let columnData = [];
                        if (column && typeof column === 'object') {
                            columnData = column.data().unique().sort().toArray();
                        }



                        // columnRecordsInfo.html(renderColumnRecordsInfo(columnData.length));
                        columnRecordsList.empty();
                        columnData.forEach((data, dataIndex) => {
                            const li = $('<li></li>');
                            const checkboxID = sectionId + '_' + columnName + '_checkbox_' + dataIndex;
                            const checkbox = createFilterCheckbox(checkboxID, data, data, false, false);
                            li.append(checkbox);
                            columnRecordsList.append(li);
                        });

                        // show/hide search input based on size of all column data
                        columnRecordsSearchWrapper.toggle(columnAllData.length >= 10);

                        // show/hide select all checkbox input based on size of column data
                        columnRecordsSelectAllWrapper.toggle(columnData.length > 1);
                    }
                }
            }


            // check checkboxes by getting selected filters (if any)
            if (filter && typeof filter === 'object') {
                let selected = [];
                if (filter.hasOwnProperty('selected')) {
                    selected = filter.selected;

                    if (Array.isArray(selected) && selected.length > 0) {
                        selected.forEach(value => {
                            const checkbox = $('[data-val="' + value + '"]');
                            checkbox.prop('checked', true);

                        });
                        filterIcon.html('<i class="bx bx-filter-alt"></i>').addClass('text-primary');
                    }
                }

            }
        });
    }
}
const populateFilters = (sectionId, tableId, dt) => {
    const columns = dt.settings().init().columns;
    if (Array.isArray(columns) && columns.length > 0) {

        const dropdownColumns = columns.filter(column => column.filter.type === 'dropdown');
        // const daterangeColumns = columns.filter(column => column.filter.type === 'daterange');


        populateDropdownFilters(sectionId, tableId, dt, dropdownColumns);
        // populateDaterangeFilters(dt, daterangeColumns);
    }
}
const populateFiltersTable = (sectionId, tableId, cb) => {
    if ($.fn.DataTable.isDataTable(tableId)) {
        $(tableId).DataTable().destroy();
    }
    setPopulateFiltersFlag(tableId, true);

    const columnsInfo = {
        operator_name: {
            type: 'dropdown',
            text: 'Operator',
        },
        counter_id: {
            type: 'dropdown',
            text: 'Counter',
        },
        category_name: {
            type: 'dropdown',
            text: 'Category',
        },
    };
    const columns = [];
    Object.keys(columnsInfo).forEach(key => {
        const column = columnsInfo[key];
        columns.push({
            name: key,
            data: key,
            filter: {
                columnName: key,
                columnText: column.text,
                type: column.type,
                selected: null,
                applied: false
            }
        });
    });

    const data = GLOBAL_STATE.data;
    $(tableId).DataTable({
        data,
        columns,
        initComplete: function (settings, json) {
            const dt = this.api();
            const data = dt.rows({ search: 'applied' }).data().toArray();

            createFilters(sectionId, tableId);
            populateFilters(sectionId, tableId, dt);

            dt.on('length', function (e, settings, len) {
                setPopulateFiltersFlag(tableId, false);
            });
            dt.on('page', function (e, settings, len) {
                setPopulateFiltersFlag(tableId, false);
            });

            dt.off('draw');
            dt.on('draw', function (e, settings) {
                if (getPopulateFiltersFlag(tableId)) {
                    populateFilters(sectionId, tableId, dt);
                }

                const data = dt.rows({ search: 'applied' }).data().toArray();
                if (cb && typeof cb === 'function') {
                    cb(data);
                }
            });
            if (cb && typeof cb === 'function') {
                cb(data);
            }
        }
    });
}

const populateAvgOfWaitSection = () => {
    populateFiltersTable('avgOfWait', '#avgOfWait_Table', (data) => {
        populateAvgOfWaitTable(data);
    });
}
const populateAvgOfServiceSection = () => {
    populateFiltersTable('avgOfService', '#avgOfService_Table', (data) => {
        populateAvgOfServiceTable(data);
    });
}
const populateSections = () => {
    populateAvgOfServiceSection();
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