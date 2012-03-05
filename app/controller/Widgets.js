/*

This file is part of WIDGaT Toolkit

This work is licensed under a Creative Commons Attribution Non-Commercial ShareAlike 3.0 License

Contact:  http://arc.tees.ac.uk/
*/
Ext.define('WIDGaT.controller.Widgets', {
	extend: 'Ext.app.Controller',
	
    models: ['Widget', 'Usecase', 'Pipe', 'Compo', 'Action', 'Attribute', 'Author', 'Dependency', 'Guidance'],
    stores: ['Widgets', 'Usecases', 'Pipes', 'Compos', 'Actions', 'Attributes', 'Authors', 'Dependencies', 'Guidances'],
	
	views: [
        'widget.MetaWindow'
    ],
	
    refs: [
        {ref: 'attributeList', selector: 'attrlist'},
        {ref: 'metaWindow', selector: 'metawindow'},
        {ref: 'newWindow', selector: 'newwindow'},
        {ref: 'saveWindow', selector: 'savewindow'},
        {ref: 'guidanceList', selector: 'guidancelist'},
        {ref: 'widgetView', selector: 'widgetview'},
		{ref: 'widgetViewport', selector: 'widgatviewport'},
		{ref: 'viewWindow', selector: 'viewwindow'}
    ],

    init: function() {
    	var me = this;
        me.control({
			'templateDataView': {
				itemclick: me.onTemplateItemClick,
				containerclick: me.onTemplateContainerClick
			},
            '#usecaseButton': {
                click: me.onUsecaseButtonClick
            },
            '#widgetDetailsButton': {
                click: me.onWidgetDetailsButtonClick
            },
            '#details-save': {
    			click: me.onDetailsSaveButtonClick
    		},
            '#meta-save': {
    			click: me.onUsecaseSaveButtonClick
    		},
            '#newButton': {
    			click: me.onNewButtonClick
    		},
            '#startButton': {
    			click: me.onNewButtonClick
    		},
            '#previewButton': {
    			click: me.onPreviewButtonClick
    		},
            '#toolPreview': {
    			click: me.onPreviewButtonClick
    		},
            '#saveButton': {
    			click: me.onSaveButtonClick
    		},
            '#closeButton': {
    			click: me.onCloseButtonClick
    		},
            '#save-save': {
    			click: me.onSaveWidgetClick
    		},
    		'#move-finish': {
    			click: me.onFinishButtonClick
    		},
			'#toolRefresh': {
				click: function() { me.getWidgetView().setSrc(); }	
			},
			'#toolBin': {
				click: me.onToolBinClick	
			},
			'compolist': {
				dropped: me.onCompoDropped
			},
			'widgatviewport': {
				afterrender: me.onViewportAfterRender
			},
			'savewindow': {
				beforeclose: function() {
					console.log('savewindow.beforeclose');
					me.getWidgetView().setSrc();	
				}
			}
        });
        /*this.getWidgetsStore().load();
        console.log(this.getWidgetsStore());*/
		this.getWidgetsStore().on({
			 load: me.onWidgetStoreLoad,
			 scope: me
		});
    },
    
	onViewportAfterRender: function() {
		var reqStr = Ext.urlDecode(window.location.search.substring(1));
		
		var me = this;
		if(reqStr.w) {
			console.log('Loading widget id:', reqStr.w);
			Ext.data.JsonP.request({
				url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
				params: {
					'verb': 'refresh',
					'name': reqStr.w
				},
				success: function(response) {
					me.getWidgetView().setSrc('http://arc.tees.ac.uk/WIDEST/Widget/Output/' + response.id + '/');
					var tmpStore = Ext.create('WIDGaT.store.Widgets');
					tmpStore.loadRawData(response);
					WIDGaT.activeWidget = tmpStore.first();
					me.getWidgetsStore().loadRawData(response);
					//WIDGaT.activeWidget = me.getWidgetsStore().first();
					console.log("Widget successfuly loaded with id:", WIDGaT.activeWidget.internalId);
					console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
					Ext.getCmp('urlDisplay').setText('<a data-qtip="This link allows you to directly open your widget in WIDGaT. It is strongly recommended to save it somewhere sure" href="http://arc.tees.ac.uk/widgat-code/?w=' + response.id + '/" target="_blank" >http://arc.tees.ac.uk/widgat-code/?w=' + response.id + '/</a>');
					Ext.getCmp('welcomeWindow').close();
					
					//populating ActionStore
					WIDGaT.actionStore = Ext.create('WIDGaT.store.Actions');
					WIDGaT.outputStore = Ext.create('WIDGaT.store.Attributes');
					
					WIDGaT.activeWidget.components().each(function(record) {
						record.actions().each(function(action) { 
							WIDGaT.actionStore.add(action);
						});
						
						record.attributes().each(function(attr) {
							if(attr.get('output'))
								WIDGaT.outputStore.add(attr);
						});
					});
					
					console.log('WIDGaT.actionStore', WIDGaT.actionStore);
					//Ext.ComponentManager.get('cbActions').bindStore(WIDGaT.actionStore);
					me.activeTool();
				},
				failure: function(response) {
					console.log('An error occured while creating widget. response:', response);		
				}
			});
		}
	},
	
    onNewButtonClick: function() {
    	console.log("WIDGaT.controller.Widget.onNewButtonClick()");
		
		var me = this;
		
		if(WIDGaT.activeWidget) {
			Ext.MessageBox.confirm('Confirm',
			'You are currently editing a widget. Are you sure you want to create a new one ?',
			function(btn) {
				if(btn=='yes') {
					WIDGaT.activeWidget = null;
					WIDGaT.selectedCompo = null;
					me.disableTool();
					Ext.create('WIDGaT.view.widget.NewWindow').show();
				}
			});
		} else {
			Ext.create('WIDGaT.view.widget.NewWindow').show();
		}
    	
    },
	
	//File Menu preview button
    onPreviewButtonClick: function() {
    	console.log("WIDGaT.controller.Widget.onPreviewButtonClick()");
		window.open('http://arc.tees.ac.uk/WIDEST/Widget/Output/' + WIDGaT.activeWidget.get('id') + '/','_blank','',true); //(url, target, options, history.replace)
    },
	
	//File Menu close button
    onCloseButtonClick: function() {
    	console.log("WIDGaT.controller.Widget.onCloseButtonClick()");
		var me = this;
		if(WIDGaT.activeWidget) {
			Ext.MessageBox.confirm('Confirm',
			'You are currently editing a widget. Make sure you keep the widget\'s URL. Close ?',
			function(btn) {
				if(btn=='yes') {
					WIDGaT.activeWidget = null;
					WIDGaT.newWidget = null;
					me.disableTool();
					Ext.create('WIDGaT.view.WelcomeWindow').show();
				}
			});
		}
    },
	
    //Widget Save Window
    onSaveButtonClick: function() {
    	console.log("WIDGaT.controller.Widget.onSaveButtonClick()");
		
		var winS = Ext.create('WIDGaT.view.widget.SaveWindow');
		
		winS.down('#saveWindow-title').setValue(WIDGaT.activeWidget.get('name'));
		winS.down('#saveWindow-description').setValue(WIDGaT.activeWidget.get('description'));
		
		winS.show();
    },
	
    onSaveWidgetClick: function(btn) {
    	//Save details
		console.log("WIDGaT.controller.Widget.onSaveWidgetClick()");
		
		var me = this;
		var _btn = btn;
		var saveFrm = btn.up('window').down('form').getForm();
		
		if(!saveFrm.hasInvalidField()) {
			var frmVals = saveFrm.getFieldValues();
			console.log(frmVals.completed);
			WIDGaT.activeWidget.set('name', frmVals.title);
			WIDGaT.activeWidget.set('description', frmVals.description);
			
			var tmpOb = new Object();
			tmpOb.name = WIDGaT.activeWidget.get('name');
			tmpOb.description = WIDGaT.activeWidget.get('description');
			
			Ext.data.JsonP.request({
				url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
				params: {
					'verb': 'modify',
					'name': WIDGaT.activeWidget.get('id'),
					'value': Ext.JSON.encode(tmpOb)
				},
				success: function(response) {
					console.log('Widget details saved successfully. response:', response);
				},
				failure: function(response) {
					console.log('An error occured while saving widget details. response:', response);	
				}
			});
			
			if(frmVals.completed){
				Ext.MessageBox.confirm('Confirm',
				'You chose to update the design status of your widget as \'Completed\'. This mean that your widget will no longer be editable. However, you can share this link and allow other users to start from a copy of your widget and adapt it as they see fit. Do you wish to continue ?',
				function(btn) {
					if(btn=='yes') {
						//send completed to server
						
						if(WIDGaT.activeWidget.usecases().first()) {
							var useC = WIDGaT.activeWidget.usecases().first()
							if(useC.get('persona') == '' || useC.get('scenario') == '' || useC.get('keywords') == '') {
								Ext.MessageBox.confirm('Confirm',
								'Warning! You can\'t complete your widget without usecase. Do you wish to fill it now ?',
								function(btn) {
									if(btn=='yes') {
										Ext.create('WIDGaT.view.widget.MetaWindow').show();
									}
								});
							} else {
								Ext.MessageBox.confirm('Confirm',
								'Congratulations! You have completed your widget. You are now able to export and share it to several different website. Do you wish to do so ?',
								function(btn) {
									if(btn=='yes') {
										//send completed to server
										_btn.up('window').close();
										Ext.create('WIDGaT.view.widget.ExportWindow').show();
									}
								});
							}
						}
					}
				});
			} else { _btn.up('window').close(); }
		}
		console.log('After save widget, activeWidget:', WIDGaT.activeWidget);
    },
	
	//Widget Description Window
	onWidgetDetailsButtonClick: function (btn) {
		console.log("WIDGaT.controller.Widget.onWidgetDetailsButtonClick()");
    	var winD = Ext.create('WIDGaT.view.widget.DetailsWindow');
		winD.down('widgetedit').setTitle('');
		winD.down('#title').setValue(WIDGaT.activeWidget.get('name'));
		winD.down('#description').setValue(WIDGaT.activeWidget.get('description'));
		if(WIDGaT.activeWidget.authors().getCount() > 0) {
			winD.down('#name').setValue(WIDGaT.activeWidget.authors().first().get('name'));
			winD.down('#email').setValue(WIDGaT.activeWidget.authors().first().get('email'));
			winD.down('#link').setValue(WIDGaT.activeWidget.authors().first().get('link'));
			winD.down('#organisation').setValue(WIDGaT.activeWidget.authors().first().get('organisation'));
		}
		winD.show();
    },
    
    onDetailsSaveButtonClick: function(btn) {
    	//Save details
		console.log("WIDGaT.controller.Widget.onDetailsSaveButtonClick()");
		
		var me = this;
		
		WIDGaT.activeWidget.set('name', btn.up('window').down('#title').getValue());
		WIDGaT.activeWidget.set('description', btn.up('window').down('#description').getValue());
		
		WIDGaT.activeWidget.authors().first().set('name', btn.up('window').down('#name').getValue());
		WIDGaT.activeWidget.authors().first().set('email', btn.up('window').down('#email').getValue());
		WIDGaT.activeWidget.authors().first().set('link', btn.up('window').down('#link').getValue());
		WIDGaT.activeWidget.authors().first().set('organisation', btn.up('window').down('#organisation').getValue());
		
		console.log('After save details, activeWidget:', WIDGaT.activeWidget);
		console.log('                    activeWidget.authors:', WIDGaT.activeWidget.authors().first());
		
		//Send modif to server
		var tmpO = new Object();
		tmpO.name = WIDGaT.activeWidget.get('name');
		tmpO.description = WIDGaT.activeWidget.get('description');
		tmpO.authors = new Array(WIDGaT.activeWidget.authors().first().json4Serv());
		
		Ext.data.JsonP.request({
			url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
			params: {
				'verb': 'modify',
				'name': WIDGaT.activeWidget.get('id'),
				'value': Ext.JSON.encode(tmpO)
			},
			success: function(response) {
				console.log('Widget details saved successfully. response:', response);
				me.getViewWindow().setTitle(WIDGaT.activeWidget.get('name'));
				me.getWidgetView().setSrc();
				/*var MIF = Ext.ComponentQuery.query('#stageFrame > miframe')[0];
				MIF.setSrc();*/
			},
			failure: function(response) {
				console.log('An error occured while saving widget details. response:', response);	
			}
		});
		
		btn.up('window').close();
    },
    
	//Usecase Window
    onUsecaseButtonClick: function () {
		console.log("WIDGaT.controller.Widget.onUsecaseButtonClick()");
		
		
    	var win = Ext.create('WIDGaT.view.widget.MetaWindow');
		if(WIDGaT.activeWidget.usecases().getCount() > 0)
	    	win.down('usecaseedit').loadRecord(WIDGaT.activeWidget.usecases().first());
    	win.down('usecaseedit').setTitle('');
		win.show();
    },
	
	onUsecaseSaveButtonClick: function(btn) {
    	//Save metadata
		console.log("WIDGaT.controller.Widget.onUsecaseSaveButtonClick()");
		
		if(WIDGaT.activeWidget.usecases().getCount() == 0) {
			var uC = Ext.create('WIDGaT.model.Usecase');
			uC.set('keywords', Ext.getCmp('txt_keywords').getValue());
			uC.set('persona', Ext.getCmp('persona').getValue());
			uC.set('scenario', Ext.getCmp('scenario').getValue());
			
			WIDGaT.activeWidget.usecases().add(uC);	
		} else {
			WIDGaT.activeWidget.usecases().first().set('keywords', Ext.getCmp('txt_keywords').getValue());
			WIDGaT.activeWidget.usecases().first().set('persona', Ext.getCmp('persona').getValue());
			WIDGaT.activeWidget.usecases().first().set('scenario', Ext.getCmp('scenario').getValue());
		}
		
		console.log('After save meta, activeWidget:', WIDGaT.activeWidget);
		console.log('        activeWidget.usecases:', WIDGaT.activeWidget.usecases().first());
		
		var tmpObj = new Object();
		tmpObj.usecases = new Array(WIDGaT.activeWidget.usecases().first().json4Serv());
		
		Ext.data.JsonP.request({
			url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
			params: {
				'verb': 'modify',
				'name': WIDGaT.activeWidget.get('id'),
				'value': Ext.JSON.encode(tmpObj)
			},
			success: function(response) {
				console.log('Usecase saved successfully. response:', response);
			},
			failure: function(response) {
				console.log('An error occured while saving usecase. response:', response);	
			}
		});
		
		btn.up('window').close();
    },
	
	
	//New Widget Window
	onTemplateItemClick: function (view, record, htmlItem, index) {
		console.log("WIDGaT.controller.Widget.onTemplateItemClick()");
		var vt = this.getNewWindow().down('selecttplpanel');
		Ext.each(vt.items.items, function(i) {
			if(i.down('templateDataView'))
				i.down('templateDataView').getSelectionModel().deselectAll();
		});
		view.select(index);
		Ext.getCmp('move-next').setDisabled(false);
		Ext.getCmp('move-finish').setDisabled(false);
	},
	
	onTemplateContainerClick: function (view, e) {
		console.log("WIDGaT.controller.Widget.onTemplateContainerClick()");
		var vt = this.getNewWindow().down('selecttplpanel');
		Ext.each(vt.items.items, function(i) {
			if(i.down('templateDataView'))
				i.down('templateDataView').getSelectionModel().deselectAll();
		});
		Ext.getCmp('move-next').setDisabled(true);
		Ext.getCmp('move-finish').setDisabled(true);
	},
    
    onFinishButtonClick: function(btn) {
		console.log("WIDGaT.controller.Widget.onFinishButtonClick(btn)", btn);
		
		var layout = btn.up('window').getLayout();
		var vals = layout.getLayoutItems()[1].getForm().getFieldValues();
			
		if(vals.title.length)
			WIDGaT.newWidget.set('name', vals.title);
		if(vals.description.length)
			WIDGaT.newWidget.set('description', vals.description);
		
		if(vals.name.length || vals.email.length || vals.link.length || vals.organisation.length) {
			var aut = Ext.create('WIDGaT.model.Author');
			if(vals.name.length)
				aut.set('name', vals.name);
			if(vals.email.length)
				aut.set('email', vals.email);
			if(vals.link.length)
				aut.set('link', vals.link);
			if(vals.organisation.length)
				aut.set('organisation', vals.organisation);
			WIDGaT.newWidget.authors().add(aut);
		}
		
		var me = this;
		
		var uC = Ext.create('WIDGaT.model.Usecase');
		uC.set('keywords', Ext.getCmp('txt_keywords').getValue());
		uC.set('persona', Ext.getCmp('persona').getValue());
		uC.set('scenario', Ext.getCmp('scenario').getValue());
		
		WIDGaT.newWidget.usecases().add(uC);
		
		Ext.data.JsonP.request({
			url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
			params: {
				'verb': 'create',
				'value': Ext.JSON.encode(WIDGaT.newWidget.json4Serv())
			},
			success: function(response) {
				//me.getWidgetView().setSrc('http://arc.tees.ac.uk/WIDEST/Widget/Output/' + response.id + '/');
				var tmpStore = Ext.create('WIDGaT.store.Widgets');
				tmpStore.loadRawData(response);
				WIDGaT.activeWidget = tmpStore.first();
				me.getWidgetsStore().loadRawData(response);
				//WIDGaT.activeWidget = me.getWidgetsStore().first();
				console.log("Widget successfuly created with id:", WIDGaT.activeWidget.internalId);
				console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
				Ext.getCmp('urlDisplay').setText('<a data-qtip="This link allows you to directly open your widget in WIDGaT. It is strongly recommended to save it somewhere sure" href="http://arc.tees.ac.uk/widgat-code/?w=' + response.id + '/" target="_blank" >http://arc.tees.ac.uk/widgat-code/?w=' + response.id + '/</a>');
				if(Ext.getCmp('welcomeWindow'))
					Ext.getCmp('welcomeWindow').close();
				
				//populating ActionStore
				WIDGaT.actionStore = Ext.create('WIDGaT.store.Actions');
				WIDGaT.outputStore = Ext.create('WIDGaT.store.Attributes');
				
				WIDGaT.activeWidget.components().each(function(record) {
					record.actions().each(function(action) { 
						WIDGaT.actionStore.add(action);
					});
					
					record.attributes().each(function(attr) {
						if(attr.get('output'))
							WIDGaT.outputStore.add(attr);
					});
				});
				me.getViewWindow().setTitle(WIDGaT.activeWidget.get('name'));
				console.log('WIDGaT.actionStore', WIDGaT.actionStore);
				//Ext.ComponentManager.get('cbActions').bindStore(WIDGaT.actionStore);
				me.activeTool();
			},
			failure: function(response) {
				console.log('An error occured while creating widget. response:', response);		
			}
		});
		
		btn.up('window').close();
    },
	
	onToolBinClick: function() {
		var me = this;
		console.log('onToolBinClick');
		
		if(WIDGaT.selectedCompo) {
			
			var tmpO = new Object();
			tmpO.root = 'components[' + WIDGaT.activeWidget.components().indexOfId(WIDGaT.selectedCompo.get('id')) + ']';
			Ext.data.JsonP.request({
				url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
				params: {
					'verb': 'delete',
					'name': WIDGaT.activeWidget.get('id'),
					'value': Ext.JSON.encode(tmpO)
					/*'verb': 'remove',
					'name': WIDGaT.activeWidget.get('id'),
					'value': Ext.JSON.encode(new Array(WIDGaT.selectedCompo.get('id')))*/
				},
				success: function(response) {
					console.log('Component successfully deleted. response:', response);
					WIDGaT.selectedCompo = null;
					me.getAttributeList().getStore().removeAll();
					me.getAttributeList().setTitle('Edit ');
					me.getAttributeList().down('#toolBin').setDisabled(true);
					Ext.data.JsonP.request({
						url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
						params: {
							'verb': 'refresh',
							'name': WIDGaT.activeWidget.get('id')
						},
						success: function(response) {
							//me.getWidgetView().setSrc('http://arc.tees.ac.uk/WIDEST/Widget/Output/' + response.id + '/');
							var tmpStore = Ext.create('WIDGaT.store.Widgets');
							tmpStore.loadRawData(response);
							WIDGaT.activeWidget = tmpStore.first();
							me.getWidgetsStore().loadRawData(response);
							//WIDGaT.activeWidget = me.getWidgetsStore().first();
							console.log("Widget successfuly refreshed with id:", WIDGaT.activeWidget.internalId);
							console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
							
							//populating ActionStore
							WIDGaT.actionStore.removeAll();
							WIDGaT.outputStore.removeAll();
							
							WIDGaT.activeWidget.components().each(function(record) {
								record.actions().each(function(action) { 
									WIDGaT.actionStore.add(action);
								});
								
								record.attributes().each(function(attr) {
									if(attr.get('output'))
										WIDGaT.outputStore.add(attr);
								});
							});
							//me.updateGlobalStores();
							console.log('WIDGaT.actionStore', WIDGaT.actionStore);
						},
						failure: function(response) {
							console.log('An error occured while creating widget. response:', response);		
						}
					});
					
					var MIF = Ext.ComponentQuery.query('#stageFrame > miframe')[0];
					MIF.setSrc();
				},
				failure: function(response) {
					console.log('An error occured while saving widget details. response:', response);	
				}
			});
		}
	},
	
	onCompoDropped: function(cmp, placeHolder) {
		console.log('WIDGaT.controller.Compos.onCompoDropped()');
		
		var me = this;
		var tpEl = Ext.create('Ext.Element', cmp);		
		
		var selectedCmp = this.getComposStore().getByClassName(tpEl.dom[0].id);
		
		var cmpObj = selectedCmp.json4Serv()
		var newCmp = Ext.create('WIDGaT.model.Compo', selectedCmp.json4Serv());
		
		newCmp.set('placeHolder', placeHolder.id);

		var newID = 1;
		WIDGaT.activeWidget.components().each(function(record) {
			if(record.get('className') == newCmp.get('className'))
				newID++;
		});
		newCmp.set('id', newCmp.get('className') + newID.toString());
		
		Ext.each(cmpObj.authors, function(author) {
			var newAut = Ext.create('WIDGaT.model.Author', author);
			newCmp.authors().add(newAut);
		});
		
		Ext.each(cmpObj.themes, function(theme) {
			var newThe = Ext.create('WIDGaT.model.Theme', theme);
			newCmp.themes().add(newThe);
		});
		
		Ext.each(cmpObj.attributes, function(attribute) {
			var newAtt = Ext.create('WIDGaT.model.Attribute', attribute);
			newCmp.attributes().add(newAtt);
		});
		
		Ext.each(cmpObj.actions, function(action) {
			var newAct = Ext.create('WIDGaT.model.Action', action);
			newCmp.actions().add(newAct);
		});
		
		Ext.each(cmpObj.guidances, function(guidance) {
			var newGui = Ext.create('WIDGaT.model.Guidance', guidance);
			newCmp.guidances().add(newGui);
		});
		
		Ext.each(cmpObj.dependencies, function(dependency) {
			var newDep = Ext.create('WIDGaT.model.Dependency', dependency);
			newCmp.dependencies().add(newDep);
		});
		
		
		
		console.log('top.window, component dropped:', newCmp);
		console.log('top.window, placeHolder dropped in:', placeHolder);
		console.log('top.window, new component to append: ', newCmp.actions());
		
		var tmpOR = new Object();
		
		tmpOR.verb = 'append-component';
		tmpOR.name = WIDGaT.activeWidget.get('id');
		tmpOR.value = Ext.JSON.encode(newCmp.json4Serv());
		
		Ext.Ajax.request({
			url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
			params: tmpOR,
			success: function(response, opts) {
				console.log('Compo added successfully. response:',response);
				Ext.data.JsonP.request({
					url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
					params: {
						'verb': 'refresh',
						'name': WIDGaT.activeWidget.get('id')
					},
					success: function(response) {
						//me.getWidgetView().setSrc('http://arc.tees.ac.uk/WIDEST/Widget/Output/' + response.id + '/');
						var tmpStore = Ext.create('WIDGaT.store.Widgets');
						tmpStore.loadRawData(response);
						WIDGaT.activeWidget = tmpStore.first();
						me.getWidgetsStore().loadRawData(response);
						//WIDGaT.activeWidget = me.getWidgetsStore().first();
						console.log("Widget successfuly refreshed with id:", WIDGaT.activeWidget.internalId);
						console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
						
						//populating ActionStore
						WIDGaT.actionStore.removeAll();
						WIDGaT.outputStore.removeAll();
						
						WIDGaT.activeWidget.components().each(function(record) {
							record.actions().each(function(action) { 
								WIDGaT.actionStore.add(action);
							});
							
							record.attributes().each(function(attr) {
								if(attr.get('output')) {
									WIDGaT.outputStore.add(attr);
								}
							});
						});
						//me.updateGlobalStores();
						console.log('WIDGaT.actionStore', WIDGaT.actionStore);
						console.log('WIDGaT.outputStore', WIDGaT.outputStore);
					},
					failure: function(response) {
						console.log('An error occured while creating widget. response:', response);		
					}
				});
				me.getWidgetView().setSrc();
				console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
			},
			failure: function(response, opts) {
				console.log('server-side failure with status code ' + response.status);
			}
		});
		
		//Change for a POST request
		/*Ext.data.JsonP.request({
			url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
			params: {
				'verb': 'append-component',
				'name': WIDGaT.activeWidget.get('id'),
				'value': Ext.JSON.encode(newCmp.json4Serv())
			},
			success: function(response) {
				console.log('Compo added successfully. response:',response);
				Ext.data.JsonP.request({
					url: 'http://arc.tees.ac.uk/widest/web/json.aspx',
					params: {
						'verb': 'refresh',
						'name': WIDGaT.activeWidget.get('id')
					},
					success: function(response) {
						//me.getWidgetView().setSrc('http://arc.tees.ac.uk/WIDEST/Widget/Output/' + response.id + '/');
						var tmpStore = Ext.create('WIDGaT.store.Widgets');
						tmpStore.loadRawData(response);
						WIDGaT.activeWidget = tmpStore.first();
						me.getWidgetsStore().loadRawData(response);
						//WIDGaT.activeWidget = me.getWidgetsStore().first();
						console.log("Widget successfuly refreshed with id:", WIDGaT.activeWidget.internalId);
						console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
						
						//populating ActionStore
						WIDGaT.actionStore.removeAll();
						WIDGaT.outputStore.removeAll();
						
						WIDGaT.activeWidget.components().each(function(record) {
							record.actions().each(function(action) { 
								WIDGaT.actionStore.add(action);
							});
							
							record.attributes().each(function(attr) {
								if(attr.get('output')) {
									WIDGaT.outputStore.add(attr);
								}
							});
						});
						//me.updateGlobalStores();
						console.log('WIDGaT.actionStore', WIDGaT.actionStore);
						console.log('WIDGaT.outputStore', WIDGaT.outputStore);
					},
					failure: function(response) {
						console.log('An error occured while creating widget. response:', response);		
					}
				});
				me.getWidgetView().setSrc();
				console.log('WIDGaT.activeWidget: ', WIDGaT.activeWidget);
			},
			failure: function(response) {
				console.error(response);	
			}
		});*/
	},
	
	//inserting guidance need further work to display only the relevant guidances
	onWidgetStoreLoad: function(store, records){
		console.log("WIDGaT.controller.Widget.onWidgetStoreLoad(store, records)", store, records);
		var gStore = Ext.create('WIDGaT.store.Guidances');
		var arGuid = new Array();
		store.first().components().each(function(cmp) {
			cmp.guidances().each(function(guid) { arGuid.push(guid); });										 
		});
		gStore.loadRecords(arGuid);
		console.log('gStore', gStore);
		this.getGuidanceList().bindStore(gStore);
	},
	
	updateGlobalStores: function() {
		if(!WIDGaT.actionStore && !WIDGaT.outputStore) {
			WIDGaT.actionStore = Ext.create('WIDGaT.store.Actions');
			WIDGaT.outputStore = Ext.create('WIDGaT.store.Attributes');
		} else {
			WIDGaT.actionStore.removeAll();
			WIDGaT.outputStore.removeAll();
		}
		
		WIDGaT.activeWidget.components().each(function(record) {
			record.actions().each(function(action) { 
				WIDGaT.actionStore.add(action);
			});
			
			record.attributes().each(function(attr) {
				if(attr.get('output'))
					WIDGaT.outputStore.add(attr);
			});
		});
	},
	
	//Complete tool activation
	activeTool: function() {
			console.log("WIDGaT.controller.Widget.activeTool()");
			Ext.getCmp('widgetDetailsButton').setDisabled(false);
			Ext.getCmp('saveButton').setDisabled(false);
			Ext.getCmp('previewButton').setDisabled(false);
			Ext.getCmp('closeButton').setDisabled(false);
			Ext.getCmp('undoButton').setDisabled(false);
			Ext.getCmp('redoButton').setDisabled(false);
			Ext.getCmp('usecaseButton').setDisabled(false);
			Ext.getCmp('stageFrame').setDisabled(false);
			Ext.getCmp('eastPanel').setDisabled(false);
			Ext.getCmp('compo-list').setDisabled(false);
			Ext.getCmp('centerPanel').setDisabled(false);
	},
	
	//Complete tool deactivation
	disableTool: function() {
			console.log("WIDGaT.controller.Widget.disableTool()");
			Ext.getCmp('widgetDetailsButton').setDisabled(true);
			Ext.getCmp('saveButton').setDisabled(true);
			Ext.getCmp('previewButton').setDisabled(true);
			Ext.getCmp('closeButton').setDisabled(true);
			Ext.getCmp('undoButton').setDisabled(true);
			Ext.getCmp('redoButton').setDisabled(true);
			Ext.getCmp('usecaseButton').setDisabled(true);
			Ext.getCmp('stageFrame').setDisabled(true);
			Ext.getCmp('eastPanel').setDisabled(true);
			Ext.getCmp('compo-list').setDisabled(true);
			Ext.getCmp('centerPanel').setDisabled(true);
	}
})