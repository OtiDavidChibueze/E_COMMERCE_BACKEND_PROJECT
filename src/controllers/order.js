//* ORDER CONTROLLER
const mongoose = require('mongoose')
const OrderModel = require('../model/order')

//* ORDER ENDPOINTS

//* GET ALL ORDERS
module.exports.getOrders = async (req, res) => {
  //* GET ALL ORDERS
  const orders = await OrderModel.find({})

  //* IF NO ORDERS ....
  if (!orders)
    return res.status(404).json({ orders: 0, message: 'no orders available' })

  //* SEND ALL ORDERS TO THE CLIENT
  res.status(200).json({ orders })
}

//* GET ORDER BY ID
module.exports.getOrderById = async (req, res) => {
  //* CHECKING IF ITS A VALID ID
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(404).json({ error: 'invalid order id' })

  //* GETTING THE ORDER WITH THE PROVIDED ID
  const order = await OrderModel.findById({ _id: req.params.id })

  //* IF ORDER ISN'T FOUND....
  if (!order) {
    return res.status(404).json({ message: 'order not found' })
  } else {
    //* SEND THE ORDER TO THE CLIENT
    return res.status(200).send({ order: order })
  }
}

//* GET ORDER COUNTS
module.exports.getOrdersCounts = async (req, res) => {
  //* GETTING THE ORDER COUNTS
  const orderCount = await OrderModel.countDocuments()

  //*  IF NO ORDER ...
  if (!orderCount) {
    return res.status(404).json({ counts: 0 })
  } else {
    //* SEND THE COUNTS TO THE CLIENT
    return res.status(200).json({ counts: orderCount })
  }
}

//* UPDATE USER ORDER STATUS
module.exports.updateUserOrderStatus = async (req, res) => {
  //* CHECKING IF ITS A VALID ID
  if (!mongoose.isValidObjectId(req.params.orderId))
    return res
      .status(400)
      .json({ status: 'bad request', message: 'invalid order id' })

  //* GET THE ORDER ID IN THE PARAMS
  const { orderId } = req.params

  //* ACCESSING THE DETAILS IN THE BODY
  const { status } = req.body

  try {
    //* GET THE ORDER...
    const findOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    )

    //* IF ERROR OCCUR DURING THE UPDATE ...
    if (!findOrder) return res.status(500).json({ message: 'internet error ' })

    //* SEND A SUCCESS RESPONSE
    res
      .status(200)
      .json({ message: 'order status updated ', order: findOrder.orderStatus })
  } catch (error) {
    console.log({ error: error })
  }
}
