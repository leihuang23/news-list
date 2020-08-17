// data store
const computedStack = [];
const observersMap = new WeakMap();
const computedDependenciesTracker = new WeakMap();

// helper functions
function isObj(object) {
  return object && typeof object === 'object';
}

export function observe(obj, options = {}) {
  const { props, ignore, deep = true } = options;
  if (obj.__observed) {
    return obj;
  }

  const isWatched = prop =>
    (!props || props.includes(prop)) && (!ignore || !ignore.includes(prop));

  observersMap.set(obj, new Map());

  if (deep) {
    Object.entries(obj).forEach(function([key, val]) {
      if (isObj(val)) {
        obj[key] = observe(val, options);
      }
    });
  }

  const proxy = new Proxy(obj, {
    get(_, prop) {
      if (prop === '__observed') return true;

      if (isWatched(prop)) {
        if (computedStack.length) {
          const propertiesMap = observersMap.get(obj);
          if (!propertiesMap.has(prop)) propertiesMap.set(prop, new Set());
          const tracker = computedDependenciesTracker.get(computedStack[0]);
          if (tracker) {
            if (!tracker.has(obj)) {
              tracker.set(obj, new Set());
            }
            tracker.get(obj).add(prop);
          }
          propertiesMap.get(prop).add(computedStack[0]);
        }
      }

      return obj[prop];
    },

    set(_, prop, value) {
      if ((Array.isArray(obj) && prop === 'length') || obj[prop] !== value) {
        const deeper = deep && isObj(value);
        const propertiesMap = observersMap.get(obj);

        const oldValue = obj[prop];
        if (isObj(oldValue)) delete obj[prop];

        obj[prop] = deeper ? observe(value, options) : value;

        const dependents = propertiesMap.get(prop);
        if (dependents) {
          for (const dependent of dependents) {
            const tracker = computedDependenciesTracker.get(dependent);
            if (
              dependent.__disposed ||
              (tracker && (!tracker.has(obj) || !tracker.get(obj).has(prop)))
            ) {
              dependents.delete(dependent);
            } else if (dependent !== computedStack[0]) {
              dependent();
            }
          }
        }
      }

      return true;
    }
  });

  return proxy;
}

export function computed(wrappedFunction, { callback, autoRun = true } = {}) {
  const proxy = new Proxy(wrappedFunction, {
    apply(target, thisArg, argsList) {
      function observeComputation(fun) {
        computedDependenciesTracker.set(callback || proxy, new WeakMap());
        computedStack.unshift(callback || proxy);
        const result = fun ? fun() : target.apply(thisArg, argsList);
        computedStack.shift();
        return result;
      }

      argsList.push({
        computeAsync: function(target) {
          return observeComputation(target);
        }
      });

      return observeComputation();
    }
  });

  if (autoRun) {
    proxy();
  }

  return proxy;
}

export function dispose(computedFunction) {
  computedDependenciesTracker.delete(computedFunction);
  return (computedFunction.__disposed = true);
}
