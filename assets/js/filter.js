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
const handleClickClearFilter = (sectionId, tableId, columnName, columnText, list) => {

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

        const filtersContainer = $('#' + sectionId + '_' + columnName + '_filters_container');
        const filterIcon = filtersContainer.find('.filter-icon');
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
const handleClickApplyFilter = (sectionId, tableId, columnName, columnText, list) => {
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
const handleSearchItemsInFilter = (e) => {
    const input = e.currentTarget;
    const filtersContainer = $(input).closest('.filters-container');

    let value = input.value;
    if (value && typeof value === 'string') {
        value = value.toLowerCase();
    }

    const labels = filtersContainer.find('ul > li > div').toArray();
    labels.forEach(label => {
        let text = $(label).find('span').html();
        if (text && typeof text === 'string') {
            text = text.toLowerCase();
        }
        $(label).toggle(text.indexOf(value) > -1);
    });
}
const createFilterToggleSelection = (sectionId, tableId, column) => {
    const columnName = column.filter.columnName;

    const id = sectionId + tableId + columnName + '_selectAllCheckbox';

    const div = $('<div></div>');
    div.attr('class', 'toggle-selection-wrapper');

    const checkbox = $('<input/>');
    checkbox.attr('type', 'checkbox');
    checkbox.attr('class', 'filter-checkbox');
    checkbox.attr('id', id);
    checkbox.prop('checked', true);


    checkbox.on('change', function () {
        const isChecked = $(this).prop('checked');
        const checkboxList = $(this).closest('.filters-card').find('ul > li input[type="checkbox"]');
        $(checkboxList).prop('checked', isChecked);
    });


    const label = $('<label></label>');
    label.attr('for', id);

    const span = $('<span></span>');
    span.html('Select All');

    div.append(checkbox).append(label).append(span);

    return div;
}
const creatFilterCard = (sectionId, tableId, column) => {

    const columnName = column.filter.columnName;
    const columnText = column.filter.columnText;


    const card = $('<div></div>');
    card.attr('class', 'filters-card');

    const header = $('<div></div>');
    header.attr('class', 'filters-card-header');

    const tools = $('<div></div>');
    tools.attr('class', 'header-tools');

    const searchInputWrapper = $('<div></div>');
    searchInputWrapper.attr('class', 'search-input-wrapper');

    const searchInput = $('<input/>');
    searchInput.attr('type', 'search');
    searchInput.attr('class', 'form-control form-control-sm');
    searchInput.attr('placeholder', 'Search ' + columnText);
    searchInput.on('input', handleSearchItemsInFilter);
    searchInputWrapper.append(searchInput);

    const toggleSelectionContainer = createFilterToggleSelection(sectionId, tableId, column);
    tools.append(searchInputWrapper).append(toggleSelectionContainer);
    header.append(tools);

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
        handleClickApplyFilter(sectionId, tableId, columnName, columnText, list);
    });

    const btnClear = $('<button></button>');
    btnClear.attr('class', 'btn btn-sm btn-secondary me-2');
    btnClear.html('Clear');
    btnClear.on('click', function () {
        handleClickClearFilter(sectionId, tableId, columnName, columnText, list);
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

    filtersDropdown.append(
        $('<div></div>').attr('class', 'filter-icon').html('<i class="bx bx-filter-alt"></i>')
    );
    filtersDropdown.append(
        $('<div></div>').attr('class', 'filter-text').html(columnText)
    );
    filtersDropdown.append(
        $('<div></div>').attr('class', 'arrow-icon').html('<i class="bx bx-chevron-down"></i>')
    );


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
            const filtersContainer = $('#' + sectionId + '_' + columnName + '_filters_container');
            const menuBody = filtersContainer.find('.filter-card-body');
            const filterIcon = filtersContainer.find('.filter-icon');
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