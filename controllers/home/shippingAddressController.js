const shippingAddressModel = require('../../models/shippingAddressModel');
const { responseReturn } = require('../../utiles/response');

class shippingAddressController {
    
    // Get all saved addresses for a customer
    get_addresses = async (req, res) => {
        const { customerId } = req.params;
        try {
            const addresses = await shippingAddressModel.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
            responseReturn(res, 200, { addresses });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    // Save a new address
    save_address = async (req, res) => {
        const { customerId, name, email, phone, address, province, city, area, post, isDefault } = req.body;
        
        try {
            // Validate phone number
            if (!/^\d{10}$/.test(phone)) {
                return responseReturn(res, 400, { error: 'Phone number must be exactly 10 digits' });
            }

            // If this is set as default, unset other default addresses
            if (isDefault) {
                await shippingAddressModel.updateMany(
                    { customerId, isDefault: true },
                    { isDefault: false }
                );
            }

            const newAddress = await shippingAddressModel.create({
                customerId,
                name,
                email,
                phone,
                address,
                province,
                city,
                area,
                post,
                isDefault: isDefault || false
            });

            responseReturn(res, 201, { 
                message: 'Address saved successfully',
                address: newAddress 
            });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    // Update an address
    update_address = async (req, res) => {
        const { addressId } = req.params;
        const { name, email, phone, address, province, city, area, post, isDefault } = req.body;
        
        try {
            // Validate phone number
            if (phone && !/^\d{10}$/.test(phone)) {
                return responseReturn(res, 400, { error: 'Phone number must be exactly 10 digits' });
            }

            const existingAddress = await shippingAddressModel.findById(addressId);
            if (!existingAddress) {
                return responseReturn(res, 404, { error: 'Address not found' });
            }

            // If this is set as default, unset other default addresses
            if (isDefault) {
                await shippingAddressModel.updateMany(
                    { customerId: existingAddress.customerId, isDefault: true, _id: { $ne: addressId } },
                    { isDefault: false }
                );
            }

            const updatedAddress = await shippingAddressModel.findByIdAndUpdate(
                addressId,
                { name, email, phone, address, province, city, area, post, isDefault },
                { new: true, runValidators: true }
            );

            responseReturn(res, 200, { 
                message: 'Address updated successfully',
                address: updatedAddress 
            });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    // Delete an address
    delete_address = async (req, res) => {
        const { addressId } = req.params;
        
        try {
            const deletedAddress = await shippingAddressModel.findByIdAndDelete(addressId);
            
            if (!deletedAddress) {
                return responseReturn(res, 404, { error: 'Address not found' });
            }

            responseReturn(res, 200, { message: 'Address deleted successfully' });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }

    // Set an address as default
    set_default_address = async (req, res) => {
        const { addressId } = req.params;
        
        try {
            const address = await shippingAddressModel.findById(addressId);
            
            if (!address) {
                return responseReturn(res, 404, { error: 'Address not found' });
            }

            // Unset all default addresses for this customer
            await shippingAddressModel.updateMany(
                { customerId: address.customerId, isDefault: true },
                { isDefault: false }
            );

            // Set this address as default
            address.isDefault = true;
            await address.save();

            responseReturn(res, 200, { 
                message: 'Default address updated',
                address 
            });
        } catch (error) {
            responseReturn(res, 500, { error: error.message });
        }
    }
}

module.exports = new shippingAddressController();
