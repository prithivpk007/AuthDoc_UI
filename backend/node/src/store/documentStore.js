const store = new Map();

/**
 * In-memory document stored as the temp file in the local data of the C drive
   No DB by design (prototype)
 */
module.exports = {
  save(id, data) {
    store.set(id, data);
  },
  get(id) {
    return store.get(id);
  }
};
