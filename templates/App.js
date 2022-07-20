Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    config: { defaultSettings: {} },

    items: [{
        id: 'mainContainer',
        xtype: 'container',
        layout: {
            type: 'vbox',
            align: 'stretch',
            defaultMargins: 5,
        }
    }],

    launch() {
        Rally.data.wsapi.Proxy.superclass.timeout = 180000;
    },

    async update() {
        this.setLoading(true);
        this.down('#mainContainer').removeAll();

        try {
            console.log();
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
            }
            if (e.error && e.error.response && e.error.response.status) {
                return `${defaultMessage} (Status ${e.error.response.status})`;
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
