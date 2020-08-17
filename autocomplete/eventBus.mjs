const subscriptions = Object.create(null);

const EventBus = {
  register: function register(evt, func) {
    if (typeof func !== 'function') {
      throw 'Subscribers must be functions';
    }
    const oldSubscriptions = subscriptions[evt] || [];
    oldSubscriptions.push(func);
    subscriptions[evt] = oldSubscriptions;
  },

  emit: function emit(evt, ...args) {
    const subFunctions = subscriptions[evt] || [];
    for (let i = 0; i < subFunctions.length; i++) {
      subFunctions[i].apply(null, args);
    }
  },

  unregister: function unregister(evt, func) {
    const oldSubscriptions = subscriptions[evt] || [];
    const newSubscriptions = oldSubscriptions.filter(item => item !== func);
    subscriptions[evt] = newSubscriptions;
  },

  cancel: function cancel(evt) {
    delete subscriptions[evt];
  }
};

export default EventBus;
