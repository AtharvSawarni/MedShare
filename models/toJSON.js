// Makes JSON replies look the same as in Phase 2: "id" instead of "_id", no "__v", no password data
module.exports = {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.hash;
    delete ret.salt;
  },
};
