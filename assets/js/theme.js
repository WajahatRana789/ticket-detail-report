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
}
$('#menuList li').on('click', handleClickMenuItem);
$(document).ready(function () {
    if ($(window).width() <= 767) {
        $('html').removeClass('side-menu-open');
    }
});