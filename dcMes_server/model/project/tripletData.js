const mongoose = require("mongoose");

/**
 * 将 MAC 规范为冒号分隔大写十六进制（如 10:06:48:A9:3E:EF）
 */
function normalizeMac(input) {
  if (input == null || input === "") {
    return { ok: false, message: "MAC 不能为空" };
  }
  if (typeof input !== "string") {
    return { ok: false, message: "MAC 格式错误" };
  }
  const s = input.trim().toUpperCase().replace(/-/g, ":");
  let parts;
  if (s.includes(":")) {
    parts = s.split(":").filter(Boolean);
  } else if (/^[0-9A-F]{12}$/.test(s)) {
    parts = s.match(/.{2}/g);
  } else {
    return { ok: false, message: "MAC 格式错误" };
  }
  if (parts.length !== 6) {
    return { ok: false, message: "MAC 格式错误" };
  }
  for (const p of parts) {
    if (!/^[0-9A-F]{2}$/.test(p)) {
      return { ok: false, message: "MAC 格式错误" };
    }
  }
  return { ok: true, mac: parts.join(":") };
}

const tripletDataSchema = new mongoose.Schema(
  {
    did: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    mac: { type: String, required: true, trim: true },
    timeArea: { type: String, required: true, trim: true },
    language: { type: String, required: true, trim: true },
    sn: { type: String, trim: true },
    status: {
      type: String,
      enum: ["unbound", "bound"],
      default: "unbound",
    },
    productionPlanWorkOrderId: {
      type: mongoose.Schema.ObjectId,
      ref: "production_plan_work_order",
    },
    workOrderNo: { type: String, trim: true },
  },
  {
    collection: "triplet_data",
    timestamps: true,
  }
);

tripletDataSchema.index({ did: 1 }, { unique: true });
tripletDataSchema.index({ key: 1 }, { unique: true });
tripletDataSchema.index({ mac: 1 }, { unique: true });
tripletDataSchema.index({ sn: 1 }, { unique: true, sparse: true });
tripletDataSchema.index({ status: 1, createdAt: 1 });

tripletDataSchema.pre("save", function (next) {
  if (!this.mac) {
    return next();
  }
  const r = normalizeMac(this.mac);
  if (!r.ok) {
    return next(new Error(r.message));
  }
  this.mac = r.mac;
  next();
});

const TripletData = mongoose.model("triplet_data", tripletDataSchema);
TripletData.normalizeMac = normalizeMac;
module.exports = TripletData;
