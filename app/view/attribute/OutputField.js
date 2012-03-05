/*

This file is part of WIDGaT Toolkit

This work is licensed under a Creative Commons Attribution Non-Commercial ShareAlike 3.0 License

Contact:  http://arc.tees.ac.uk/

*/
 Ext.define('WIDGaT.view.attribute.OutputField', {
  extend:'Ext.form.Picker',
  alias:'widget.outputfield',
  xtype:'combotree',
  requires:["Ext.tree.Panel"],
  matchFieldWidth:false,
  value:'',
  //triggerCls: Ext.baseCSSPrefix + 'form-plus-trigger',
  //renderTo: Ext.getBody(),
  createPicker: function(){

    var me = this,
    picker;
      
	WIDGaT.outputStore.group('widgat.model.compo_id');
	//console.log(WIDGaT.outputStore.getGroups());
	
	var obRoot = new Object();
	obRoot.expanded = true;
	obRoot.children = new Array();
	
	
	Ext.each(WIDGaT.outputStore.getGroups(), function(group) {
			var obGrp = new Object();
			obGrp.name = group.name;
			obGrp.leaf = false;
			obGrp.expanded = true;
			obGrp.children = new Array();
			Ext.each(group.children, function(child) {
				var obChild = new Object();
				obChild.leaf = true;
				obChild.name = child.get('name');
				obChild.shortName = child.get('shortName');
				obGrp.children.push(obChild);
			});
			obRoot.children.push(obGrp);
	});
	
	var store = Ext.create('Ext.data.TreeStore', {
		model: 'WIDGaT.model.Attribute',
		root: obRoot
	});
	
	console.log('getRootNode', store.getRootNode());
    var treeConfig = Ext.apply({
      pickerField: me,
      store:  store,         
      width:me.bodyEl.getWidth(),
      height:150,
		rootVisible: false,
		multiSelect: false,
		floating: true,
        hidden: true,
		displayField: 'name',
		valueField: 'shortName',
      listeners:{
        scope:me,
        itemclick:me.onItemClick
      }
           

    }, me.treeConfig);

    picker = me.picker = Ext.create('Ext.tree.Panel',treeConfig);
	console.log(picker);
    return picker;
  },


  onItemClick:function(view, record, item, index, e, eOpts){
	console.log('record', record);
    this.setFieldValue(record.raw.shortName, record.raw.name);
    this.fireEvent('select', this, record.raw.shortName);
    this.collapse();
  },

  setFieldValue: function(value, label) {
    var me = this;
    me.setValue(value);
    me.setRawValue(label);
  },

  setValue:function(value){
    var me = this,
    inputEl = me.inputEl;

    if (inputEl && me.emptyText && !Ext.isEmpty(value)) {
      inputEl.removeCls(me.emptyCls);
    }
    me.value = value;
    me.applyEmptyText();
  },
  setRawValue:function(value){
    this.inputEl.dom.value = value==null?"":value;
  },
  getValue:function(){
    return this.value;
  },
  getRawValue:function(){
    return this.inputEl.dom.value;
  },
  setValueWithReload:function(parentId, nodeId, nodeText){
   
    this.setFieldValue(nodeId, nodeText);

  },
  
  onCollapse: function() {
        this.picker.destroy();
		this.callParent(arguments);
    },
})