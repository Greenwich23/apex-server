// controllers/customer/address.controller.js
import Address from "../../models/Address.js";
import User from "../../models/User.js";
import { successResponse, errorResponse } from "../../utils/apiResponse.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user.id,
      isActive: true,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return successResponse(res, "Addresses fetched", {
      addresses,
      count: addresses.length,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return errorResponse(res, error.message);
  }
};

// POST /api/addresses
export const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      label,
      isDefault,
    } = req.body;

    // Check if this is the first address
    const existingCount = await Address.countDocuments({
      user: req.user.id,
      isActive: true,
    });

    const shouldBeDefault = isDefault || existingCount === 0;

    // If setting as default, unset all other defaults
    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country: country || "Nigeria",
      label: label || "home",
      isDefault: shouldBeDefault,
    });

    // If this is the default, update user's defaultAddress
    if (shouldBeDefault) {
      await User.findByIdAndUpdate(req.user.id, {
        defaultAddress: address._id,
      });
    }

    return successResponse(res, "Address added successfully", { address }, 201);
  } catch (error) {
    console.error("Error adding address:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });

    if (!address) {
      return errorResponse(res, "Address not found", 404);
    }

    const {
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      label,
      isDefault,
    } = req.body;

    // If setting as default, unset all other defaults
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, _id: { $ne: address._id } },
        { isDefault: false },
      );
      await User.findByIdAndUpdate(req.user.id, {
        defaultAddress: address._id,
      });
    }

    // Update address fields
    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zipCode) address.zipCode = zipCode;
    if (country) address.country = country;
    if (label) address.label = label;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    return successResponse(res, "Address updated successfully", { address });
  } catch (error) {
    console.error("Error updating address:", error);
    return errorResponse(res, error.message);
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!address) {
      return errorResponse(res, "Address not found", 404);
    }

    // Soft delete
    address.isActive = false;
    await address.save();

    // If this was the default, set a new one
    if (address.isDefault) {
      const newDefault = await Address.findOne({
        user: req.user.id,
        isActive: true,
        _id: { $ne: address._id },
      });

      if (newDefault) {
        newDefault.isDefault = true;
        await newDefault.save();
        await User.findByIdAndUpdate(req.user.id, {
          defaultAddress: newDefault._id,
        });
      } else {
        await User.findByIdAndUpdate(req.user.id, {
          defaultAddress: null,
        });
      }
    }

    return successResponse(res, "Address deleted successfully");
  } catch (error) {
    console.error("Error deleting address:", error);
    return errorResponse(res, error.message);
  }
};

// PUT /api/addresses/:id/set-default
export const setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id,
      isActive: true,
    });

    if (!address) {
      return errorResponse(res, "Address not found", 404);
    }

    // Unset all other defaults
    await Address.updateMany(
      { user: req.user.id, _id: { $ne: address._id } },
      { isDefault: false },
    );

    // Set this as default
    address.isDefault = true;
    await address.save();

    // Update user's defaultAddress
    await User.findByIdAndUpdate(req.user.id, {
      defaultAddress: address._id,
    });

    return successResponse(res, "Default address updated successfully", {
      address,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    return errorResponse(res, error.message);
  }
};
