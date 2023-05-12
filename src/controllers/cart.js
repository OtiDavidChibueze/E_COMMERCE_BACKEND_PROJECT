//* CART CONTROLLER
const CartModel = require('../../src/model/cart')

const mongoose = require('mongoose')

//* CART END POINTS

//* GET ALL CARTS
module.exports.getCarts = async (req, res) => {
  //* GET ALL CARTS
  const carts = await CartModel.find({})

  //* IF NOT CARTS ARE FOUND
  if (!carts) {
    return res.status(404).json({ carts: 0, message: 'no carts available' })
  } else {
    //* SEND ALL CARTS TO THE CLIENT
    return res.status(200).send({ carts: carts })
  }
}

//* GET CART BY ID
module.exports.getCartById = async (req, res) => {
  //* CHECKING IF ITS A VALID ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: 'invalid id' })
  try {
    //* GETTING THE CART WITH THE PROVIDED ID
    const cart = await CartModel.findById({ _id: req.params.id })

    if (!cart) {
      return res.status(404).json({ message: 'cart not found' })
    } else {
      return res.status(200).send({ cart: cart })
    }
  } catch (error) {
    console.log({ error })
  }
}
