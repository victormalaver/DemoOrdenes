'use strict';

app.producto = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

// START_CUSTOM_CODE_producto
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_producto
(function (parent) {
    var dataProvider = app.data.demoOrdenes,
        fetchFilteredData = function (paramFilter, searchFilter) {
            var model = parent.get('productoModel'),
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
        processImage = function (img) {

            function isAbsolute(img) {
                if  (img && (img.slice(0,  5)  ===  'http:' || img.slice(0,  6)  ===  'https:' || img.slice(0,  2)  ===  '//'  ||  img.slice(0,  5)  ===  'data:')) {
                    return true;
                }
                return false;
            }

            if (!img) {
                var empty1x1png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=';
                img = 'data:image/png;base64,' + empty1x1png;
            } else if (!isAbsolute(img)) {
                var setup = dataProvider.setup || {};
                img = setup.scheme + ':' + setup.url + setup.appId + '/Files/' + img + '/Download';
            }

            return img;
        },
        flattenLocationProperties = function (dataItem) {
            var propName, propValue,
                isLocation = function (value) {
                    return propValue && typeof propValue === 'object' &&
                        propValue.longitude && propValue.latitude;
                };

            for (propName in dataItem) {
                if (dataItem.hasOwnProperty(propName)) {
                    propValue = dataItem[propName];
                    if (isLocation(propValue)) {
                        dataItem[propName] =
                            kendo.format('Latitude: {0}, Longitude: {1}',
                                propValue.latitude, propValue.longitude);
                    }
                }
            }
        },
        dataSourceOptions = {
            type: 'everlive',
            transport: {
                typeName: 'producto',
                dataProvider: dataProvider
            },
            change: function (e) {
                var data = this.data();
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];

                    flattenLocationProperties(dataItem);
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
                        'nombre': {
                            field: 'nombre',
                            defaultValue: ''
                        },
                        'descripcion': {
                            field: 'descripcion',
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
        productoModel = kendo.observable({
            dataSource: dataSource,
            searchChange: function (e) {
                var searchVal = e.target.value,
                    searchFilter;

                if (searchVal) {
                    searchFilter = {
                        field: 'nombre',
                        operator: 'contains',
                        value: searchVal
                    };
                }
                fetchFilteredData(productoModel.get('paramFilter'), searchFilter);
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
                var dataItem = e.dataItem || productoModel.originalItem;

                app.mobileApp.navigate('#components/producto/details.html?uid=' + dataItem.uid);

            },

            itemClickAdd: function (e) {
                var dataItem = e.dataItem || productoModel.originalItem;

                app.mobileApp.navigate('#components/producto/details.html?uid=' + e.data.uid);

            },
            goToOrdenAdd: function (e) {
                var productos = [];
                var total = 0.00;
                $('input.cantidad').each(function (i) {
                    if ($(this).val() > 0) {
                        productos.push({
                            producto: $(this).attr("producto"),
                            cantidad: $(this).val(),
                        });
                        total = total + parseFloat($(this).attr("precio") * $(this).val() );
                    }
                })
                app.mobileApp.navigate('#components/orden/add.html');

                $("#listaPedido").text(JSON.stringify(productos));
                $("#ordenModelAddItemView #total").val(total);
            },
            addClick: function () {
                app.mobileApp.navigate('#components/producto/add.html');
            },
            editClick: function () {
                var uid = this.originalItem.uid;
                app.mobileApp.navigate('#components/producto/edit.html?uid=' + uid);
            },
            detailsShow: function (e) {
                productoModel.setCurrentItemByUid(e.view.params.uid);
            },
            setCurrentItemByUid: function (uid) {
                var item = uid,
                    dataSource = productoModel.get('dataSource'),
                    itemModel = dataSource.getByUid(item);

                if (!itemModel.nombre) {
                    itemModel.nombre = String.fromCharCode(160);
                }

                productoModel.set('originalItem', itemModel);
                productoModel.set('currentItem',
                    productoModel.fixHierarchicalData(itemModel));

                return itemModel;
            },
            linkBind: function (linkString) {
                var linkChunks = linkString.split('|');
                if (linkChunks[0].length === 0) {
                    return this.get("currentItem." + linkChunks[1]);
                }
                return linkChunks[0] + this.get("currentItem." + linkChunks[1]);
            },
            imageBind: function (imageField) {
                if (imageField.indexOf("|") > -1) {
                    return processImage(this.get("currentItem." + imageField.split("|")[0]));
                }
                return processImage(imageField);
            },
            currentItem: {}
        });

    parent.set('addItemViewModel', kendo.observable({
        onShow: function (e) {
            // Reset the form data.
            this.set('addFormData', {
                descripcion: '',
                unidad: '',
                precio: '',
                nombre: '',
            });
        },
        onSaveClick: function (e) {
            var addFormData = this.get('addFormData'),
                addModel = {
                    descripcion: addFormData.descripcion,
                    unidad: addFormData.unidad,
                    precio: addFormData.precio,
                    nombre: addFormData.nombre,
                },
                filter = productoModel && productoModel.get('paramFilter'),
                dataSource = productoModel.get('dataSource');

            dataSource.add(addModel);
            dataSource.one('change', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.sync();
        }
    }));

    parent.set('editItemViewModel', kendo.observable({
        editFormData: {},
        onShow: function (e) {
            var itemUid = e.view.params.uid,
                dataSource = productoModel.get('dataSource'),
                itemData = dataSource.getByUid(itemUid),
                fixedData = productoModel.fixHierarchicalData(itemData);

            this.set('itemData', itemData);
            this.set('editFormData', {
                descripcion: itemData.descripcion,
                unidad: itemData.unidad,
                precio: itemData.precio,
                nombre: itemData.nombre,
            });
        },
        linkBind: function (linkString) {
            var linkChunks = linkString.split(':');
            return linkChunks[0] + ':' + this.get("itemData." + linkChunks[1]);
        },
        onSaveClick: function (e) {
            var editFormData = this.get('editFormData'),
                itemData = this.get('itemData'),
                dataSource = productoModel.get('dataSource');

            // prepare edit
            itemData.set('descripcion', editFormData.descripcion);
            itemData.set('unidad', editFormData.unidad);
            itemData.set('precio', editFormData.precio);
            itemData.set('nombre', editFormData.nombre);

            dataSource.one('sync', function (e) {
                app.mobileApp.navigate('#:back');
            });

            dataSource.one('error', function () {
                dataSource.cancelChanges(itemData);
            });

            dataSource.sync();
        }
    }));

    if (typeof dataProvider.sbProviderReady === 'function') {
        dataProvider.sbProviderReady(function dl_sbProviderReady() {
            parent.set('productoModel', productoModel);
        });
    } else {
        parent.set('productoModel', productoModel);
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

})(app.producto);

// START_CUSTOM_CODE_productoModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_productoModel