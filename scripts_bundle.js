'use strict';

var LightTableFilter = (function(Arr) {

    var _input;

    function _onInputEvent(e) {
        _input = e.target;
        var val = _input.value.toLowerCase();
        status = false;

        var tables = document.getElementsByClassName(_input.getAttribute('data-table'));
        Arr.forEach.call(tables, function(table) {
            Arr.forEach.call(table.tBodies, function(tbody) {
                Arr.forEach.call(tbody.rows, function(row){
                    _filter(row, val);
                });
            });
        });
    }

    function _filter(row, val, negative, split) {
        split = typeof split !== 'undefined' ? split : '';

        var searchColumns = Array.from(row.querySelectorAll('td:not(:first-of-type)'));
        var text = '';

        Arr.forEach.call(searchColumns, function(searchColumn) {
            text += $(searchColumn).find('.tablesaw-cell-content').text().toLowerCase();
        });

        if (typeof val === 'string'){
            if (negative){
                row.style.display = text.indexOf(val) !== -1 ? 'none' : 'table-row';
                return text.indexOf(val) !== -1
            }
            else{
                row.style.display = text.indexOf(val) === -1 ? 'none' : 'table-row';
                return text.indexOf(val) !== -1
            }
        }
    }

    function  _filter_checkboxes(data, row) {
        var textArrays = {};
        var checkedValues = {};

        // Show row by default
        $(row).removeClass('is-hidden');

        $.each(data, function (id, column_data) {
            var textRaw = $(row).find('td:nth(' + id  + ')').find('.tablesaw-cell-content').text().replace(/\s+/g, '').toLowerCase();
            textArrays[id] = []; // values of text!
            checkedValues[id] = [];

            if (parseInt(id) === 3 && textRaw.indexOf('/')){ // #3 column contains specific data type! - V = vegetarian LS = lowsodium D = diabeticfriendly LC = lowcarb LH = lowcholesterol GF = glutenfree DF = dairyfree
                textRaw = textRaw.split(' ').join('')
                textRaw = textRaw.replace(/(?:\r\n|\r|\n)/g, '/');
                textRaw = textRaw.split('/');
                for (var i=textRaw.length-1; i>=0; i--) {
                    textRaw[i].replace(/\s+/g, '');
                    textArrays[id].push(textRaw[i]);
                }
            }
            else{
                textArrays[id].push(textRaw);
            }
            // get "checked" values
            $.each(column_data, function (index, checkbox) {
                if (checkbox.checked){
                    checkedValues[id].push(checkbox.value.toLowerCase())
                }
            });
        });

        var filter_order = [2, 4, 3];
        $.each(filter_order, function (index, id) {

            var currentTextArray = textArrays[id];
            var currentCheckedValues = checkedValues[id];

            if (currentCheckedValues.length > 0){
                var found = false;

                $.each(currentCheckedValues, function (index, value) {
                    if ($.inArray( value, currentTextArray ) !== -1){
                        found = true;
                    }
                });

                if (!found)
                    $(row).addClass('is-hidden');
            }
        });
    }

    return {
        init: function() {
            // inputs filters
            var inputs = document.getElementsByClassName('search-input');
            Arr.forEach.call(inputs, function(input) {
                input.oninput = _onInputEvent;
            });

            // checkboxes filters
            var $multiselects = $('[data-toggle="multiselect"]');
            var $rows = $('#tableEditable tbody tr');

            // Generate full checkboxes data
            var data = {};
            $.each($multiselects, function (i, multiselect) {
                var id = $(multiselect).data('row');
                data[id] = $(multiselect).find('input:checkbox').map(function() {
                    return {value: $(this).val(), checked:$(this).is(':checked')};
                }).toArray();
            });

            $('[data-toggle="multiselect"] input:checkbox').on('change', function() {
                var id = $(this).closest('[data-toggle="multiselect"]').data('row');
                var value = $(this).val();
                var checked = $(this).is(':checked');

                for (var i in data[id]) {
                    if (data[id][i].value === value) {
                        data[id][i].value = value;
                        data[id][i].checked = checked;
                    }
                }


                $.each($rows, function(i, row) {
                    _filter_checkboxes(data, row);
                });
            });

        }
    };
})(Array.prototype);

$(function() {
    var $table = $('#tableEditable');
    var $btn = $('[data-toggle="data-export"]');
    "use strict";

    // DOM-ready auto-init of plugins.
    // Many plugins bind to an "enhance" event to init themselves on dom ready, or when new markup is inserted into the DOM
    // Use raw DOMContentLoaded instead of shoestring (may have issues in Android 2.3, exhibited by stack table)
    if (!("Tablesaw" in window)) {
        throw new Error("Tablesaw library not found.");
    }
    if (!("init" in Tablesaw)) {
        throw new Error("Your tablesaw-init.js is newer than the core Tablesaw version.");
    }

    Tablesaw.init();

    $('#tableEditable').on('click', 'input[name="rows-select"]', function(){
        var checkBoxes = $("input[name=\"row-select[]\"]");
        var currentChecbox = $(this);

        $('input[name="rows-select"]').each(function(i, e){
            if (!$(e).is(currentChecbox)){
                $(this).prop("checked", currentChecbox.prop("checked"));
            }
        });

        checkBoxes.each(function(e){
            $(this).prop("checked", currentChecbox.prop("checked"));
            $(this).trigger('change');
        });
    });

    $('#tableEditable').on('click', 'input[name="delete-confirm"]', function(){
        var checkBoxes = $("input[name=\"delete-confirm\"]");
        var currentChecbox = $(this);

        $('input[name="delete-confirm"]').each(function(i, e){
            if (!$(e).is(currentChecbox)){
                $(this).prop("checked", currentChecbox.prop("checked"));
            }
        });
    });

    var selectedCheckboxes = 0;

    $("input[name=\"row-select[]\"]").change(function () {
        if (!$(this).is(':checked')){
            $(this).closest('tr').addClass('is-disabled');
            selectedCheckboxes -= 1;
        }
        else{
            $(this).closest('tr').removeClass('is-disabled');
            selectedCheckboxes += 1;
        }

        if (selectedCheckboxes >= 4){
            scollButtons();
        }
    });


    // Floating button
    var favInitilized = false;

    // Setup isScrolling variable
    var isScrolling;

    var $button = $('.table-button.fav');
    var $buttonDefault = $('.table-button.default');

    function scollButtons(){
        if (selectedCheckboxes >= 4 || favInitilized){
            favInitilized = true
            var anchorIsVisble = false;

            if($(window).scrollTop() + $(window).height() > $(document).height() - $button.height()) {
                anchorIsVisble = true;
            }

            if (anchorIsVisble){
                $button.addClass('is-hidden');
                $buttonDefault.removeClass('is-invisible');
            }
            else{
                $button.removeClass('is-hidden');
                $buttonDefault.addClass('is-invisible');
            }
        }
    }


    // Listen for scroll events
    window.addEventListener('scroll', function ( event ) {

        // Clear our timeout throughout the scroll
        window.clearTimeout( isScrolling );

        // Set a timeout to run after scrolling ends
        isScrolling = setTimeout(function() {
            scollButtons();
        }, 50);

    }, false);


    $('.actions-buttons').on('click', '.table-add', function(e) {
        e.preventDefault();
        var $clone = $table.find('tr.row-hidden').clone(true).removeClass('row-hidden');
        $clone.addClass('is-moving');
        var $row = $(this).closest('tr');
        if ($row && $clone){
            $row.after($clone);
        }
        setTimeout(function() {
            $clone.removeClass('is-moving');
        }, 200);
    });

    $('.actions-buttons').on('click', '.table-remove', function(e) {
        e.preventDefault();
        var $row = $(this).parents('tr');

        if ($('input[name="delete-confirm"]').not(":hidden").is(':checked')){
            if (confirm('Remove selected row?')) {

                $row.addClass('is-moving');
                setTimeout(function() {
                    $row.detach();
                }, 200);
            }
        }
        else{
            $row.addClass('is-moving');
            setTimeout(function() {
                $row.detach();
            }, 200);
        }
    });

    $('.actions-arrows').on('click', '.table-up', function(e) {
        e.preventDefault();
        var $row = $(this).parents('tr');
        $row.addClass('is-moving');
        $row.prev().before($row.get(0));

        setTimeout(function() {
            $row.removeClass('is-moving');
        }, 500);
    });

    $('.actions-arrows').on('click', '.table-down', function(e) {
        e.preventDefault();
        var $row = $(this).parents('tr');
        $row.addClass('is-moving');
        $row.next().after($row.get(0));

        setTimeout(function() {
            $row.removeClass('is-moving');
        }, 500);
    });

    // A few jQuery helpers for exporting only
    jQuery.fn.pop = [].pop;
    jQuery.fn.shift = [].shift;
    jQuery.fn.ignore = function(sel){
        return this.clone().find(sel||">*").remove().end();
    };


    $btn.click(function (e) {
        e.preventDefault();
        var pdfName = $('#tableEditable').data('pdfName');
        var clientName = $('input[name="client"]').val();
        var clientDate = $('#client-date').val();


        var text = $('label[for="client"]').text() + ' ' + clientName || '';
        var today = $('label[for="client-date"]').text() + ' ' + clientDate || '';
        var topOffset = 9;

        if (clientName && clientDate){
            pdfName = clientName + '_' + clientDate + '.pdf';
        }
        else if(clientName){
            pdfName = clientName + '_no_date_specified' + '.pdf';
        }
        else if(clientDate){
            pdfName = 'no_user_specified_' + clientDate + '.pdf';
        }

        if (!$('input[name="client"]').val()){
            alert('You need specify client name!')
            return
        }

        var $rows = $table.find('tr:not(.is-disabled)');
        var headers = [];
        var body = [];
        var doc = new jsPDF('l');
        var skipIndexes = [0];

        // Get the headers (add special header logic here)
        $($rows.shift()).find('th:not(:empty)').each(function (i, el) {
            if (skipIndexes.indexOf(i) == -1){
                headers.push($(el).text());
            }
        });

        // Turn all existing rows into a loopable array
        $rows.each(function (el) {
            var $tds = $(this).find('td');
            var row = [];

            for (var i = 0; i < $tds.length; i++) {
                if (skipIndexes.indexOf(i) == -1){
                    row.push($($tds[i]).ignore('.tablesaw-cell-label').text().trim());
                }
            }

            body.push(row);
        });


        var imgData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAX0AAACMCAYAAACQwHlZAAAeFHpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHjarZtpkiQ3kqX/4xRzBCgWBXAcrCJ9gz7+fM8iyCpWsVqkRyaDmRHp6W4G0+UtCjDc//6vF/4Pv7yPEkpt3Yd75FcZZaTJDz3+/Pr5brF8f36/2vn9yf76euj790OJlzLf889f/f58t8nr9Z8uVH5fX399PbTfC6X+e6Hff/jjgll3Tvzw+77+e6Gcfl6337+H8fu5Wf7pcX5/r/P7Wv359q9/L41gnMr1cgrpZsuRP7vukllBHnlm/Tz5XfUmXptZv2Yuufx97MKfP/5L8Or9+9jF+fuO/NdQhOi/b/B/idHv61b/PnZfhP55RfbHj+mv/3C6/RG+f4vde6e/d3+ebhYnUh5+Hyr+XuL7iTcuQpm/jzlfjd+Vn9v3NfjqPOImY4dsLr52sGGJaD8rdmzas/t937ZZYkk3Nb6ntIm4Xuu5pZH2l5SiL3upkZ4Tcicrm6xlXk5/rsW++47vfts6dz7GO5NxMeMT//YV/u7F/5evPy/0nkrXTMEk9faT4KSaZhnKnP7kXSTE3m9M6xff7yv8mdZ//FJiMxmsX5g7Dzjj+rnEqvaP2spfnjPvq7GE+NMa9nV1+qqkcO/KYiyTgeiWq7nFllIzI47UBdmIPeWSFhmwWtOx8MhNzk5yetK9+Uyz772ppp+XgRYSUbPnRmpoIJJVSqV+WunU0Ky5llBr9dpqr6NOz168untzYdRsuZVWm7fWehtt9txLr917672PPkcaGQirw0cLo48x5uSmk0tPPj15x5wrrbzKqstXW32NNTfls8uu23fbfY89Tzr50P7HTwunn3HmtUsp3XLr9dtuv+POR629/Mqrz197/Y03/8zab1b/mjX7l8z9z1mz36wpY+V7X/tH1ni5tT8uYYKTqpyRsVSMjDdlgIJOylnsVkpS5pSzOBJNURNZs6rkHFPGyGC5luqzP3P3j8z9j3kLtfyv8pb+U+aCUvf/I3NBqfvN3L/n7W+ydubHKPlLkLpQMY35AWy8aabOf+DxH99LKtFGIgGV8PCJMjbB3POuOmEOInlgvlyapbE9Twu62aye611pVlsr3QGCnUOgT6vz1VnXslr2nju/tU5+eW4WCbKt8YafocUELtEJeBs1bz8VrLPT764lxX67IJMmbzTuGjEf7pS5ODE7rKATNZDd8jmF9Jd2WTTJnXkAtAMJQIXUZif2uWbrdw5r991JTpwWeH4if+2TdadWszWqJVQ4e4zY9ib4ytZJPA7Y0ffN+1se6a27ntEpk7vGTZnP74zycEJW1+FDM+QLJN86+Gvqtxzqj154dupqPS1F85r7Kbzel9Mwd925yXR7xG/d+g7hmYFl8CM1uvjzknSqwN5c2eCtRzPBrHenufl0JganvjZu7zwf97r5+ViREg258DDe1qQWbp1cC+IhF3Hw1zqavXsihb12G4Nb9DJbO6tBQu/NeNoot1NcwVldIuvma/LBslqmgQ+dwK1Tm/Ft/oWi7JX4xz1H9FkVp3gpK8JCl+a6w71tvwmR5rwqvCnSG9T2nLfnZ3NtRMjaw3bmkRoPktfYJHH7LfvBJ3q+2YPV25cVEOFY2sv0Kd+ZoEw4llDk+sD0lV+ct7z4Um+HVJczS6Ud29HSbg37HSg8sfzL6k9ryUGBPu9Yqpl7WKiSRyn03VOh5x+lQ0HRo2u9RfUXUCjUaeUQyDtyPmuq12a8gBONXdbmru6jkBFaHs3V3n65v+uOHFkV2r/UnXkOu6V16WtU3CJJnTKjWXpWhAhzP6vA/GBCAj5481udNuIZldahjlg29krhkk6qBtCobeVb+zhrr8eSzuA9Vsn3V4KXTtg+SevrnSUkY42VNjFqZ8SgkFf0z/An3KI3Ny2dQFKqt1BSt6fZqnq+5UmQK0FasHQqJLt2IIo71Rr6nK+tszeAO3vjDt3ncFBnA3FgyCbAeSGyhr1qx+c5rZOxDJQYYp8ljnozUAtfE0VAaHLtFzdxMlLRqansCngHVjdKvdmdaS1UWadXYb29CkEvINnw0B8rtg8a14pnp5+8xf/0fYMZEdjrfkxlDEcUAPkGwUqjGECDleKiviMehS7FIgxqaFFy8FYmwmePg1JpK3bQlTKt9RUoj/59KQA3KBgwhwDsrka9ENR4+Sotl/Z8Km2q01bNa6J24uEuLV8nuymSm4PIDXU32p94+aBY1DvZYRuu8AQ7rx8KwDOomh3ipp/BhlvID5hBV7R3i931AtBP11KSlASJgQVvqucAWuTAwT6DnnPa5+VIj85FQWQlhUYrU3QNBVDrAejxzN2h790bBUnpp3pno0OhCkDzrUOlTPJ8yJXjj6jZl+2AfDeyNEKyVkioDKli7+nMuVWyuZ4+0Gsp+UGwnwiAKMmVzhgdcAXiKNoMiuV7iIPP3EIcoJIhBfgQ0uJMGmlkIig8iyQN6M4I9IMMQNsYOEbT2yA+mK7bHnKFYFOQ83orNy+DJEB3BIEQdW7v3FlEokbdkBVFHUFRivnSLSgaalv4TSDIU6BB9quA5LiPYgIfH+tiOZ4o6HwAU7COpptXGYmn+rWZO0lApuCAcVFoghScmD/rVP19edc1ZxsrtUuVUGojoTboKNgYOiG05JTAIDwmBULTzHIWP/kKUscAbUFROpSxC3BNirE40mngsF1MVN8AW6K6biVj+0BIPJMsUDqXbG+E1qVaqPGy0TlU9rv3wvZGNSNkyP7NPh/8WgCUNuZiNWimBzcDlzgscobcWMRI8dkgyAYrHoIGIgRr3ir7A/wMcxz0Ipqz4FEQL1R/EpoAfNSFjwn2VdIv7YleZClUcIqUfDmq2ywN0Qo3OgX88iemN5jJ733eUE+gLoTKT8V3gJsn3DcGbI8lQ+4NyIK4dvgNeHNwcCZCRWBhgFsSP3FR1v/o2Ya0egVwCkgWwgPwk06al4eBOgDWTkmiagucnNBu98Jj2Ykc6H6LnE+Gv1ICHcRxM9iBteBWtC4vKO8XOQ1RHsUCTJqP0uqC3Revk0QDsiFeaACsfhviKBkLsSdoToQ61pbbVwHgBXhwselJcpNKQNoIFF3CTahHmKu0TXYTNYKcQ0NZKISK/25hyQ7jIaCoQ2QDy6XqntaFlSN2U09hAJOeBXUA60z1GqCFGgwG5qwvLTlTBL5gIhxw1gWMtIKvSGXU+c8rRA/EAd+jYnORGB2CqT2F9L2hS6NSdFQm1YIEvSBZm59MkfIcqmFHQlAdhN1LR1LT75QQGQAMPUAGSByk+d5668mqVLz9U8GBdBNnIGzjTwiXzp+mpvItebgbXdVZZW3BYJCx8GtQhtZ2QaY5TrPlXzC33f5IC62BrEoXNEmL9FzPoyIMh4RPOh4k5hIqC5gBCxEG3OeDP6oPiEG9r4FLIVaAZFL1//gDAItO5z+Fku/hjx/43jLpLZKZMFJq7iQEvtA60X4j+xY8noJohA3k1agfAoWG72A2COoYubg3xZxBQ+rNERXI+8TKUt1b/V1BlYJExc40sIAuEJezBJzcQ2QElLvwFWwQWMOISXV+BVAbx7k7hhS12DD/JA+qT9mbSPmIShBbDyyFlgJSlucmJv1HWH6cSB0PUYfoEth6h4iKDYAmmqIj5lCkCRxA5kXsGxwZdrrUxs9FaFZKA+4SVZmTzoRgjvWBPAmDROdRheAPLolSYT1tRJBLdw//dPt/vvmAe/wkCADwwYMk7kBYy8pwtKEUgIxtMEI61PkeN/RITFXbY2JcEs6Ej7ydMn8M1CG10JvPK5pDoIAYC9TpdC9SnBTzeFQh3d+RoYQZb0Up0fy1dExwG5BI6RqlbZxGfpRoNZEamiQ9bBlajBLFIuOKKNgaUJ8D4iM7FeK1JLcHYPYLlhyMLCtJlBfAzZL5GFzZkBQYdzQ5VXKQlZsWDgM5niaVLsaMF1v/qJqxIFJwWiXCq1iJOBrvlLrEX37eMG+EpxKO6R3S2ZDXQF9o5laRZpRUEWalh6ojzw+6XYMcyIUWnp6GGxH7hBxJmkog0sheoEZ55AZLfdB6wLaBqTywsKQuigE798gFYiXB5XADj3q/vD3ZCCocA/lCuhVLAkNTtHN3SslADiyd5DMoAhpGmmyA6bTxwRN/QJkPhA4aHKW5kLkwwaCZDh3B1xbWw4l7G03QMZaoWbx1f1DmQVgA+xqmAPcNPXEBnMZTcsUYMElq6ATCGD60QgouPIehuASipuNQ/LvYJfAd+yRZAoqjR6ASnEntvvEiqF1UfMP/8QxyCRWTTx1dngFxRR2xRvxXPySWh8K09wjAcnUeWeGm+BERphKDG2l5lD+Os7NYBBpuHbafW21jGt9SdOprmjbh6QBh2yymrIVYxSgEPRFZ3dggrOGRHaMz56IRUB0sAIv+shyF6sZvp6/2ZuF0DnyiXjFK+wQyTNIQdhmMjiAOVQ8jFjRrQch1NCzEsZPYi844u0us8ZvipKEgAnCy02tl3YiEwDW3PfPAbAzD0UoRxU/ARP9M7sdqNIbUBxYYrY3sOkAZjhE4OKHARbs7unvgTBEoCOIyIqI3SsIibw6KXgTDi71SaY9CBeEOvvZxtWxkutTQ6LROI2o2QNFPcSWUA2hRK00O4Bki5YelKs9GQ+e7rH02fDrl8K08bOou41uJERUJRnRdBs42eIjo0La5XlsFNADumvwe7bM0aVkkEI2GDK8wbfwA8D3iROlOFBfoH+kpYw1WDS8yWWuPE+BAO1Llm3pZEqngTSo/bAav/Wevt7Dn2LtD0bLYnuDGJuqmDFhhn/J1uDYfcC/m+EfglIfwRV3yexYN4tYi+iRyagSAvtF6oX5rrpkFwg/8kVBCpsLedP+gDo3qQ9YvjeYKVG2+EDBIWu6F2DsnTZNzqKaxFJGjBunMKRBRWEp+IYvyDIOdqAzUNXW78NbxDqoGWgW5qR/k+zI0MfGESUDYQm9Py9DXAzBYYTjjYMwd6icydj/lhqOn2xWoSw8qpKTGMUVLOxZUIxnVBsjt0M6QzgYhaWqVOgoIgeNusBirnwV1ggWkKXiACQEhcxEWIxewCy0xBXE4iqwwCvADlr+i6FkfPOX0Bwaz00JFjZRjBWwKmKk0rQIFYIGzfDGaDg1dk1xy6ugjJBFdgXahCz1Sm1eF02TPkL+ImsOdrv4dYNbQjje4aKlKzwN6RUPgQ/pJIRhl5B+tC4pCrUI6AzJrPzyCTDEPsuDMSEtgomvJlATYBXAMWg3mmAGJYhuxzOdgNpV81fYcWhSPeedStHBdc2HNn+rGBTjzaExko1MrdeEOLehxk2FEduQqZP+DNaSetS2e+EhKYw/Yr6FreQdK5OBK6ORIuiQRKZxQG6oa4oJkNG352Zx0GXF+XGojU5tj8zo+JaLIF2oM3ELEIiEQQiAzwB5OixAe1rKikTWi7Qlr6FvDGpzLlB9D8y9IgQozo15lvK+os0WycSJwcFFsp5eaRSFUEd5T8/28BFvIcFtPGgh7LoSNSAvvJULmYne4lijAbFiHjfFDx2dQF4Pt7aKru2bA8ElseNMLJyKpIpoMBtMEFX898PDaFUm70Hq5oyNhEadIOnyBtISmV4Uto1MeqGUAn4RqPkzBtbJEqTQGNmknSL+8b7hYRDgAG/w8l0TSN+W0jBubi5Yjag13pp3GSS3ScXRi08QYF4jiWQrNyd0j1pouDdrXEuRnxDy6tGqXozudX9AlGPeqfyDm9Ufwr9k1r/4TAS8co9Ew7kieGpdPyOFI3L2IBo4uwGAG3bgyrb9gmJGBGsgdYEO6d3qxacOEv+S9WJH2O6AX+rrwDDQpkhd0IF0LR6rRfwTbHtwByHb6MqsYlkoiIfXTpc4ph6CdO9N8gBsjAfvTgBFp5CgGlMaNeBri2PvngVGSAAB242ovRNOIRYnvBkJiOmRpxVNr434xwZ1Ur4TReJSIlG2mzqGnJ1aiMjaX3kDjjahVlRmP4oHwkeaogVICiPOKoxjLOoIBboXc14gzk8qBY7/jAng1aosAaAD34WiMXA1q0w0+4pRACmAxydkNnh787YAemMqDNcx/0Rw6aiKr7qpVGg2p2uhke0FNKMuRsIwABuKFlA2sNOAFtD40VmygyNLQt0OLuCys7RA5NO3kSLBuTI1rBIHG6Y7fYgk6V4C/IRh4UKNjEXq1PXh/a1ZOHdVPOvnCYoEjIxo6aOygnRWcnldkvWob7oTicbNLr2BnT58alU5pdE1gMaGanFBSoOZWBirmy8MA+7anj+/grwwNUEUGHlStLqLTCTkrJT2anBERozC0efCZ1AhSY35eoOGRzpjOiSV7F4uB/sJHIKK+xwPuDGMB8kkL0zKYeNodkkW9AXnAIsG5MyAM21S7gmylbdd07uDqvCwYLCMIInJgoJrWTQPsJ5l4SL4yYux9xCnjGi71ODVkWIUuehMsR9qgUWiaqM1EyxQkfQGUopPR0Ub2L0JME3xqZTWT6A8AIfCwjP78IHO29vNMrJiuKI/kLzlJFB0kRo04rrQiVKfGM1dEpf4NEsHjxMQLTYqNcqI9xiYZiKGIzAfRYY5KRct02COmGkeiLY92OjUEWde/9IvY5Bw2ZU6jgxMta6vvFqkbFCxS4cA+Ce24+iKkeKpRgNpJKBC2Hm8AAbDFHodYEAZjXUmDzYukbXgmOngc941urNWG1KXQOjaF4eieIHCvtIhppwfm7AMORaKDEcs3NOcHawDqNDg+32ZofgoU0l4oMDnQ0fCXcmcVPAs4F0XjaPcK4KCVu4AJ9jlrWoKZMInRsBwVeZu0DyMOHNyqorwQXahrvHgQD5IgBAjKCGxAgXSUwNb4AyF+IX/AEiL3pDE51f80eOTxgSVsHgsm2TOHkeiaQXl1erL/RurKawNyeGptLQ5tLeYpTIVfcf3I0iSvg08r6V0HlgL4pUMqkUoH+2PT7BM4WugyCjcRItTtSqrR8jBHFaJArVIkuBY9zUPCNyuBFiSpVD8X2bjeTtMh96m7or0K4PMkhJk2XyPVpIXgrNCJyCNcGZZBu9EPwZ5J/7DUwcWnWZdkhE9hlpQtxqQRWu1TEieMN2gELgJVlLV922isKJYZnvIaNS2NkiSg+Q96aiDlF0cTG37GNRrN2Anv6M2NVQQoUZH0CXpHtw9/afn5l5aff9PyeAp0NERNr2fMNeFE68Weg+ZBGDTqB+42+wao7uk7IUGLSY3L1GbcNi5YIyznzvkCv04XIG8c8pw3IN4Gnmk3iTllGNTaQlGak9jyuIpJKdrkrtok20QnIosyRK5J5qbwwIbQyZ9QAytG7uKhxXDrGmYjZsr8hgvO+nAHiE1yrNMV2MtWM1rtViwjDJEXTUv4tXk4bAPi2jm7yAy8OHZIOoYin9h4ZNszOnh+kgitBUENmpdVbKpqBKCZfGDXBX7aQdXoUjuibR6YHfLjCZFKE6MoLJEBGNrU6/L4lPaKGPJ2USP5aiSrJB6sGVUj75RPFnGDP+87oZGKmpiyQQVF2gTmwEG+k/BLmtVOzfzRyghAeWHfVb7QrUWNPejFpKlOEz29PeJc50n+ysbnsoVD8D8493aIBQlbtX8r0rKk6QzUc6HCt7d0GRwJDKPLPvX+Mt5nPi6JP/t2LcHuPWOgXPHoNETDfcnnxLVL0hPhJOTyaDW8FC06I2BOIxwdxYBAEWNd+vshj8sI3+iwUOzYE3Eg3I56pnml1xCJU+mcmE0MVrsqA0qxDwLMXWDdAkDhUR+KDeULTZzUimGKwEJHL21qa0uejKtjH1gA4XkXzwAHGJ4Fgw64RO4PWGm4I6Xk6TTRt70NenDj4xpoUj5AFpa5ilJGoZO0ozPKt9WoIoMNMMxA6ws8CYqO5x7ZS8PWNzABKQtQTFxOaToE8zS5jDpfAh6dtCFVMGZRuB2ixaO+GL49HnDxZY3GNSbJRYcfZpGd0O44OD3sGCJsk0EdcKEex1fp7wEx2ou9J4CPu9Ct2hxE4ZM6dBY9TZVq+LE04lWFaEaVMo+IcOqFdaDNULkd8+HCtkBFkKFPSGobq8G0EgtPWuEgW8t4JjGJk+CJHF/y7TE+jCkJX/itLGaMQQdliTZ1hD6DUM+FFFav9JPmg8UawiVpHyKzBmJwALLecG7qOtAQ1b5WJmukLB/E8UDkAQSna7L1QKxKkbgYTkchUP88qaZ+JjIXUSwqQiOfkTTCDihX9E0dsRzxk6D0TWpIKQLKSEDXuYOkLYFGtB9cShSSjAvgrZbQ8LEGbb4aAqE4IjQBAxk84DE0uWnUD7mwQa6bDtFo80JHsL6B+Cnlm0fiLDOe9u27sIqH+6OmgXXNH4rxYe0VUCDqlojCVdCpNYyqN/SbDpE2bciyZsTaDsAyNXrUR8gxoFInKA7ytlxALUNj0KY0OOsntzrxcMEFDb+p+6mRKZBZV9AWYT6ailAun0NbYiKggZuJBanWqbNEyMUoXNzcK8qkeLkF0Jrk8hZ0NlbDNU/DSTuo1meGI6YOWNKaooV00Eza7tEBpFya5hzpqMLx/uhKepyPB0pGukEHzdB7V7Mt7WLO1D5RPn5EOfWEZpDHo0Zds4aDUNlIcFCva8QfZqclWTh2sGp2UGBOSAiaRBitl3Twe58HiF+dHpraP0ubzhWxVh0isr2wWoHuRDYD65JFkSiiPUEuP9qAZ+06L8QzRmofx+siHCiOYkk/vzURYBkjeEGisD7cJIoFrwY/Akw9IT3e1Q47cknFfUuaqNcEWNPdfAbxN7QpIVlXND+qGR9VpKBMKFF5neJUFE/z5YiGhX8HuMHJJTkK+QhyZduwN1UjhNsDmmrDltompxy/HUHnI2l9Z/hgypL8syIQCUxgDa2njU/QtWuaRLJOhrMRWnYOjckyTadoAHnF5JPwV9sy8HXR/k7TWUawBb/gz1ComoDqBIKJ23QY/lakhbiu9o8eTCeMwEjNnqK27htsUfDWtCu8CBI0RCnQwYo145MbQbHBd/UgB6qmFEXWGb29ss4KpTjfAGl5QOl7nOLdMi60BPoA741Cw4+otxN2HWB92oLa31EeKSDyRxLVNbGOUvlDNhzYn8ikrcORxaP2wCl4HRvVmbYRdI4pE0+Ioo6fjYYognYR8UKfrCZ9hO6m1oRP6DP6r2wMwn3A7olVnYSDpCWSEVPkMl5vHXzTcToMxHHpae5DSJ2YQyOyBOh3TP8DiSX8egVsEKN++kYPrAw/IngLygHVlkHbp/mFdm+yrJCG5p+kQJFDhaiAropbuBiE6c4BZkSNsCQpWUiHcoV6J3LzASpIm5Z1kAni1yyuaHcK5iCIVcIuiY9o7+ghozaxzk4LUEffyUWkPLVUMRVoaZCcRsispuvQFMZdh3yIFqvQsSg8MHe6O7zCwnZTvUUZK3ocdDGoegiMtNnkcJSOAmJ6KQTXMcMql87FaLlSqvbbw4XMb/3cL+/qRjC4YpJnQALpYF9dru1/SkwiwYdO7T/ojboSwCD++OwJToVcnZeim/Hp0zVeXDwrjYDt0KkN08jJwFioVOeL4tYIdiD/dT6xm3ZGbtB+sI67pG9AMfIY37gVoY5EOKQdCt5KNvWPIb4aVjwd9TXovKGoJG6AJsDfEZz9G3fo+NwjG9pCqY8WpSAw2PwHYBuNXoyqxRlqrH54auh9ulfN0MNEbmnEZBr3fLv+wupUv/Ul0zEo8AaB4aocNJMm1nAXPeX6vx94dAGXBYvau9ZMgQfV/z2BhkaLfky7BB2aV9INaHOwCnI1HSziaYA8ihQmELT4CVoINLovgF4SzuTEb1k44ahDcaWJbEnGtgMZferdhqwMRpXAIng150lBRvXo3LOUBz2jkaXo61O7deqUj7aOEdAaZEGNQAzaAe9I+2hGIooHosLSAaDyvq2isxMopjoqo4D9dVDMtPlBqhjw067OfFDIc2vvSHUMStCk1HH4LWSW/m0z4ky0q5TRH9TByaLzAuwsHTRp+hAmclKUGaAbOlWGidW50qADHkM7azubqz3Rzp60i62p2pT2Bu3Q29JH2qzsGtVpExnIqBju+X24BsBmHPxSEdoA6FQGZuuAD6q5LMzaOluC/+QOh9L4bsYKEYRANziMrxsQpM7XgdCUexeq69xvpQBUsNqFAD4WhnfEbw51LFZ8QKJf0aXwrs4AtYj8CpoMt60zWDo+H+HyhBLmXbw1foaqYbQ6FgbpDt5Se99AoLXvWEL+Bi60a5D6ok6pCLyZwg1tokwQ1rA9/If81jHfNjW50AF9c4Bk4W8RBULHpUWkGaRu4EBUNN/T5GKb8jf9DzFZeaRzR/i/dzeh4ytBYbQAAA+OaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczppcHRjRXh0PSJodHRwOi8vaXB0Yy5vcmcvc3RkL0lwdGM0eG1wRXh0LzIwMDgtMDItMjkvIgogICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIgogICAgeG1sbnM6cGx1cz0iaHR0cDovL25zLnVzZXBsdXMub3JnL2xkZi94bXAvMS4wLyIKICAgIHhtbG5zOkdJTVA9Imh0dHA6Ly93d3cuZ2ltcC5vcmcveG1wLyIKICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgIHhtbG5zOnBkZj0iaHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOmZmMDdlNzM1LTBmNDAtNDg1Mi05ODkwLWNlY2Q3MjA0M2E0OCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3MzZiODkyMy1iN2E3LTQ4MDItYjMwOS02NzE1NjE5ZmE4NjMiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpmZWFlYjY0Yy0wMGE5LTQ2MGEtOGNkNi0yZjc4MTZmZTU4YTEiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IkxpbnV4IgogICBHSU1QOlRpbWVTdGFtcD0iMTU1MTExOTYyNjU3NTg5NyIKICAgR0lNUDpWZXJzaW9uPSIyLjEwLjgiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwZGY6QXV0aG9yPSJOYXRoYW4gQWxsbWFuIgogICB4bXA6Q3JlYXRvclRvb2w9IkdJTVAgMi4xMCI+CiAgIDxpcHRjRXh0OkxvY2F0aW9uQ3JlYXRlZD4KICAgIDxyZGY6QmFnLz4KICAgPC9pcHRjRXh0OkxvY2F0aW9uQ3JlYXRlZD4KICAgPGlwdGNFeHQ6TG9jYXRpb25TaG93bj4KICAgIDxyZGY6QmFnLz4KICAgPC9pcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgIDxpcHRjRXh0OkFydHdvcmtPck9iamVjdD4KICAgIDxyZGY6QmFnLz4KICAgPC9pcHRjRXh0OkFydHdvcmtPck9iamVjdD4KICAgPGlwdGNFeHQ6UmVnaXN0cnlJZD4KICAgIDxyZGY6QmFnLz4KICAgPC9pcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgIDx4bXBNTTpIaXN0b3J5PgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaQogICAgICBzdEV2dDphY3Rpb249InNhdmVkIgogICAgICBzdEV2dDpjaGFuZ2VkPSIvIgogICAgICBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmMwNzYzYmY1LTYxYWMtNDA4Mi05Nzg4LWM1ZTQ2YjI3OTJjNCIKICAgICAgc3RFdnQ6c29mdHdhcmVBZ2VudD0iR2ltcCAyLjEwIChMaW51eCkiCiAgICAgIHN0RXZ0OndoZW49IiswMzowMCIvPgogICAgPC9yZGY6U2VxPgogICA8L3htcE1NOkhpc3Rvcnk+CiAgIDxwbHVzOkltYWdlU3VwcGxpZXI+CiAgICA8cmRmOlNlcS8+CiAgIDwvcGx1czpJbWFnZVN1cHBsaWVyPgogICA8cGx1czpJbWFnZUNyZWF0b3I+CiAgICA8cmRmOlNlcS8+CiAgIDwvcGx1czpJbWFnZUNyZWF0b3I+CiAgIDxwbHVzOkNvcHlyaWdodE93bmVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6Q29weXJpZ2h0T3duZXI+CiAgIDxwbHVzOkxpY2Vuc29yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6TGljZW5zb3I+CiAgPC9yZGY6RGVzY3JpcHRpb24+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAg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';
        doc.addImage(imgData, 'JPEG', 5, 4, 38.1, 14.0);

        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFontStyle('bold');
        doc.text(text, 50, 11);


        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFontStyle('normal');
        doc.text(today, 50, 16);

        var $legend = $('#legend');
        if ($legend.length){
            var legend  = $legend.text();
            doc.setFontSize(9);
            doc.setTextColor(11);
            doc.text(legend, 122, 5);
            topOffset = topOffset + 10
        }


        // Or JavaScript:
        doc.autoTable({
            head: [headers],
            body: body,
            startY: topOffset,
            tableWidth: 'auto',
            styles: {cellWidth: 'auto', rowPageBreak: 'auto', cellPadding: .9, fontSize: 8},
            headStyles: {minCellWidth: 14, fillColor: [92, 2, 36]},
            margin: {top: 5, bottom: 5, left: 4, right: 4},
            willDrawCell: function(data) {
                if (data.row.section === 'body' && data.column.dataKey == 0){
                    doc.setFontStyle('bold');
                    doc.setFontSize(8);
                }
            },
        });


        doc.save(pdfName);
    });

    $( '[data-toggle="multiselect"] select' ).on('mousedown', function(e) {
        e.preventDefault();
        this.blur();
        window.focus();

    });

    // Search stuff
    $( '[data-toggle="multiselect"] .select-overlay' ).click(function(e){
        var checkboxes = $(this).parent().next();
        var currentIndex = $(this).closest('[data-toggle="multiselect"]').index();

        if (checkboxes.hasClass('is-hidden')) {
            checkboxes.removeClass('is-hidden');
        } else {
            checkboxes.addClass('is-hidden');
        }

        $.each($('.dietary-checkboxes'), function (i, e) {
            if (currentIndex !== i){
                $(e).addClass('is-hidden');
            }
        })
    });

    $('body').on('click', function(e) {
        if($(e.target).closest('[data-toggle="multiselect"]').length == 0) {
            $('.dietary-checkboxes').addClass('is-hidden');
        }
    });

    LightTableFilter.init();
    $('.js-table').addClass('is-loaded');
});