const initTooltip = () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
}

$('#btn-toggle-side-menu').on('click', () => {
    $('html').toggleClass('side-menu-open');
});
const handleClickMenuItem = (e) => {
    const li = $(e.currentTarget);

    if (li.hasClass('active')) {
        return;
    }

    const sectionID = li.attr('data-section');
    const text = li.text();

    $('#menuList li').removeClass('active');
    $('section').hide();
    li.addClass('active');
    $('#' + sectionID).show();

    initTooltip();

    if ($(window).width() <= 767) {
        $('html').removeClass('side-menu-open');
    }
}
$('#menuList li').on('click', handleClickMenuItem);
$('#app-overlay, #btn-close-side-menu').on('click', () => {
    $('html').removeClass('side-menu-open');
});

$('[data-section]').hide();
$('[data-section="fu"]').show();

$(document).ready(function () {
    if ($(window).width() <= 767) {
        $('html').removeClass('side-menu-open');
    }
});