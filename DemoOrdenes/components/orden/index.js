'use strict';

app.orden = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

// START_CUSTOM_CODE_orden
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_orden
(function (parent) {
    var dataProvider = app.data.demoOrdenes,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('ordenModel'),
                dataSource = model.get('dataSource');

            if (paramFilter) {
                model.set('paramFilter', paramFilter);
            } else {
                model.set('paramFilter', undefined);
            }

            if (paramFilter && searchFilter) {
                dataSource.filter({
                    logic: 'and',
                    filters: [paramFilter, searchFilter]
                });
            } else if (paramFilter || searchFilter) {
                dataSource.filter(paramFilter || searchFilter);
            } else {
                dataSource.filter({});
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'orden',
                dataProvider: dataProvider
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                }
            },
            error: function (e) {

                if (e.xhr) {
                    alert(JSON.stringify(e.xhr));
                }
            },
            schema: {
                model: {
                    fields: {
                        'codigo': {
                            field: 'codigo',
                            defaultValue: ''
                        },
                        'estado': {
                            field: 'estado',
                            defaultValue: ''
                        },
                    }
                }
            },
            serverFiltering: true,
            serverSorting: true,
            serverPaging: true,
            pageSize: 50
        },
        dataSource = new kendo.data.DataSource(dataSourceOptions),
        ordenModel = kendo.observable({
            dataSource: dataSource,
            searchChange: function (e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'codigo',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(ordenModel.get('paramFilter'), searchFilter);
            },
            fixHierarchicalData: function (data) {
                var result = {},
                    layout = {};

                $.extend(true, result, data);

                (function removeNulls(obj) {
                    var i, name,
                        names = Object.getOwnPropertyNames(obj);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];

                        if (obj[name] === null) {
                            delete obj[name];
                        } else if ($.type(obj[name]) === 'object') {
                            removeNulls(obj[name]);
                        }
                    }
                })(result);

                (function fix(source, layout) {
                    var i, j, name, srcObj, ltObj, type,
                        names = Object.getOwnPropertyNames(layout);

                    for (i = 0; i < names.length; i++) {
                        name = names[i];
                        srcObj = source[name];
                        ltObj = layout[name];
                        type = $.type(srcObj);

                        if (type === 'undefined' || type === 'null') {
                            source[name] = ltObj;
                        } else {
                            if (srcObj.length > 0) {
                                for (j = 0; j < srcObj.length; j++) {
                                    fix(srcObj[j], ltObj[0]);
                                }
                            } else {
                                fix(srcObj, ltObj);
                            }
                        }
                    }
                })(result, layout);

                return result;
            },
            itemClick: function (e) {
                var dataItem = e.dataItem || ordenModel.originalItem;

                app.mobileApp.navigate('#components/orden/details.html?uid=' + dataItem.uid);

            },
            addClick: function () {
                app.mobileApp.navigate('#components/orden/add.html');
            },
            detailsShow: function (e) {
                ordenModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = ordenModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.codigo) {
                    itemModel.codigo = String.fromCharCode(160);
                }

                ordenModel.set('originalItem', itemModel);
                ordenModel.set('currentItem',
                    ordenModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            currentItem: {}
        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            // Reset the form data.
            this.set('addFormData', {
                pago: '',
                productos: '',
                codigo: '',
                total: '',
            });
        },
        onSaveClick: function (e) {
            var addFormData = this.get('addFormData'),
                addModel = {
                    pago: $("#pago .km-state-active .km-text").text(),
                    codigo: addFormData.codigo,
                    total: $("#ordenModelAddItemView #total").val(),
                    estado: "Espera",
                    tipo: "Pedido venta",
                    productos: JSON.stringify($("#listaPedido").text()),
                },
                filter = ordenModel && ordenModel.get('paramFilter'),
                dataSource = ordenModel.get('dataSource');

            dataSource.add(addModel);
            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#components/orden/view.html');
            });

            dataSource.sync();
        },
        goToProductos: function () {
            app.mobileApp.navigate('#components/orden/producto.html');
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('ordenModel', ordenModel);
        });
    } else {
        parent.set('ordenModel', ordenModel);
    }

    parent.set('onShow', function (e) {
        var param = e.view.params.filter ? JSON.parse(e.view.params.filter) : null,
            isListmenu = false,
            backbutton = e.view.element && e.view.element.find('header [data-role="navbar"] .backButtonWrapper');

        if (param || isListmenu) {
            backbutton.show();
            backbutton.css('visibility', 'visible');
        } else {
            if (e.view.element.find('header [data-role="navbar"] [data-role="button"]').length) {
                backbutton.hide();
            } else {
                backbutton.css('visibility', 'hidden');
            }
        }

        fetchFilteredData(param);
    });

})(app.orden);

// START_CUSTOM_CODE_ordenModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_ordenModel