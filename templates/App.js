Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    config: { defaultSettings: {} },

    items: [{
        id: Utils.AncestorPiAppFilter.RENDER_AREA_ID,
        xtype: 'container',
        layout: {
            type: 'hbox',
            align: 'middle',
            defaultMargins: 5,
        }
    }, {
        id: Utils.AncestorPiAppFilter.PANEL_RENDER_AREA_ID,
        xtype: 'container',
        layout: {
            type: 'hbox',
            align: 'middle',
            defaultMargins: 5,
        }
    }, {
        id: 'mainContainer',
        xtype: 'container',
        layout: {
            type: 'vbox',
            align: 'stretch',
            defaultMargins: 5,
        }
    }],

    launch: function () {
        Rally.data.wsapi.Proxy.superclass.timeout = 180000;
        this.addFilters();
    },

    // Multi-level filters may not be necessary. If so, remove this code as well as
    // the dependency in package.json then run `npm update` to remove from the project
    addFilters() {
        this.ancestorFilterPlugin = Ext.create('Utils.AncestorPiAppFilter', {
            ptype: 'UtilsAncestorPiAppFilter',
            pluginId: 'ancestorFilterPlugin',
            settingsConfig: { labelWidth: 225 },
            displayMultiLevelFilter: true,
            visibleTab: 'HierarchicalRequirement',
            projectScope: 'user',
            listeners: {
                scope: this,
                ready(plugin) {
                    plugin.addListener({
                        scope: this,
                        select: this.update,
                        change: this.update
                    });

                    this.update();
                },
            }
        });

        this.addPlugin(this.ancestorFilterPlugin);
    },

    async update() {
        this.setLoading('Loading Filters...');
        this.down('#mainContainer').removeAll();

        try {
            let filters = await this.ancestorFilterPlugin.getAllFiltersForType('HierarchicalRequirement', true);
            console.log(filters);
        } catch (e) {
            this.showError(e);
            this.setLoading(false);
            return;
        }
        this.setLoading(false);
    },

    getData() {
        this.setLoading('Loading Data...');
        let context = this.getContext().getDataContext();

        let store = Ext.create('Rally.data.wsapi.Store', {
            model: '',
            autoLoad: false,
            context,
            filters: [],
            fetch: ['Name'],
            enablePostGet: true,
        });

        return this.wrap(store.load());
    },

    onTimeboxScopeChange(timeboxScope) {
        this.timeboxScope = timeboxScope;
        this.callParent(arguments);
        this.update();
    },

    showError(msg, defaultMessage) {
        Rally.ui.notify.Notifier.showError({ message: this.parseError(msg, defaultMessage) });
    },

    parseError(e, defaultMessage) {
        defaultMessage = defaultMessage || 'An unknown error has occurred';

        if (typeof e === 'string' && e.length) {
            return e;
        }
        if (e.message && e.message.length) {
            return e.message;
        }
        if (e.exception && e.error && e.error.errors && e.error.errors.length) {
            if (e.error.errors[0].length) {
                return e.error.errors[0];
            } else {
                if (e.error && e.error.response && e.error.response.status) {
                    return `${defaultMessage} (Status ${e.error.response.status})`;
                }
            }
        }
        if (e.exceptions && e.exceptions.length && e.exceptions[0].error) {
            return e.exceptions[0].error.statusText;
        }
        if (e.exception && e.error && typeof e.error.statusText === 'string' && !e.error.statusText.length && e.error.status && e.error.status === 524) {
            return 'The server request has timed out';
        }
        return defaultMessage;
    },

    async wrap(deferred) {
        if (!deferred || !_.isFunction(deferred.then)) {
            return Promise.reject(new Error('Wrap cannot process this type of data into a ECMA promise'));
        }
        return new Promise((resolve, reject) => {
            deferred.then({
                success(...args) {
                    resolve(...args);
                },
                failure(error) {
                    Rally.getApp().setLoading(false);
                    reject(error);
                },
                scope: this
            });
        });
    },

    getSettingsFields() {
        return [];
    },

    setLoading(msg) {
        this.down('#mainContainer').setLoading(msg);
    }
});
