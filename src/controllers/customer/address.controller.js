import Address from "../../models/Address.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({
      isDefault: -1, // default address comes first
      createdAt: -1,
    });

    return successResponse(res, "Addresses fetched", { addresses });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// POST /api/addresses
export const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, zipCode, country, label, isDefault } = req.body;

    // if this is set as default, unset any existing default first
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id },
        { isDefault: false }
      );
    }

    // if user has no addresses yet, make this one the default automatically
    const existingCount = await Address.countDocuments({ user: req.user.id });

    const address = await Address.create({
      user: req.user.id,
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      label,
      isDefault: isDefault || existingCount === 0,
    });

    return successResponse(res, "Address added", { address }, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id, // ensure it belongs to this user
    });

    if (!address) return errorResponse(res, "Address not found", 404);

    const { fullName, phone, street, city, state, zipCode, country, label, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }

    Object.assign(address, {
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      label,
      isDefault: isDefault ?? address.isDefault,
    });

    await address.save();

    return successResponse(res, "Address updated", { address });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) return errorResponse(res, "Address not found", 404);

    // if we just deleted the default, make the next one default
    if (address.isDefault) {
      const next = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return successResponse(res, "Address deleted");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// PUT /api/addresses/:id/set-default
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) return errorResponse(res, "Address not found", 404);

    await Address.updateMany({ user: req.user.id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    return successResponse(res, "Default address updated", { address });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
