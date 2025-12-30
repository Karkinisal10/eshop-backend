const router = require('express').Router();
const shippingAddressController = require('../../controllers/home/shippingAddressController');

router.get('/customer/addresses/:customerId', shippingAddressController.get_addresses);
router.post('/customer/address/save', shippingAddressController.save_address);
router.put('/customer/address/:addressId', shippingAddressController.update_address);
router.delete('/customer/address/:addressId', shippingAddressController.delete_address);
router.put('/customer/address/:addressId/set-default', shippingAddressController.set_default_address);

module.exports = router;
