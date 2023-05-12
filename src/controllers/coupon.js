//* COUPON CONTROLLER
const mongoose = require('mongoose')
const CouponModel = require('../model/coupon')
const { couponSchemaValidation } = require('../Validations/schema/brand')

//* COUPON END POINTS

//* GET ALL COUPONS
module.exports.get = async (req, res) => {
  try {
    //* CREATE A QUERY OPTION
    const options = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 10,
      sort: { createdAT: -1 },
    }

    //* CREATE A QUERY SEARCH BAR
    const search = req.query.search
    const query = search ? { title: { $regex: search, $options: 'i' } } : {}
    const result = await CouponModel.paginate(query, options)

    //* IF RESULT HAS NEXT PAGE
    const nextPage = result.hasNextPage
      ? `${req.baseUrl}?page=${result.nextPage}`
      : null

    //* IF RESULT HAS PREV PAGE
    const prevPage = result.hasPrevPage
      ? `${req.baseUrl}?page=${result.prevPage}`
      : null

    //* SEND A SUCCESS RESPONSE TO THE CLIENT
    return res
      .status(200)
      .json({ coupons: result.docs, nextPage: nextPage, prevPage: prevPage })
  } catch (error) {
    return res.status(500).json({ status: ' internet error' })
  }
}

//* GET COUPON COUNTS
module.exports.getCouponCounts = async (req, res) => {
  const counts = await CouponModel.countDocuments()

  if (!counts) return res.status(404).json({ counts: 0 })

  res.status(200).json({ counts: counts })
}

//* GET COUPON BY ID
module.exports.getCouponById = async (req, res) => {
  const { couponId } = req.params

  const coupon = await CouponModel.findById(couponId)

  if (!coupon)
    return res.status(404).json({ Message: 'no coupon with such id found' })

  res.status(200).json({ coupon })
}

//* CREATE COUPON
module.exports.post = async (req, res) => {
  const { name, discount } = req.body

  try {
    const couponExist = await CouponModel.findOne({ name })
    if (couponExist)
      return res.status(200).json({ message: 'coupon already exists' })

    const createCoupon = new CouponModel({
      name,
      discount,
    })

    await createCoupon.save()

    res.status(201).json({ createCoupon })
  } catch (error) {
    console.log(error)
  }
}

//* UPDATE COUPON BY ID
module.exports.put = async (req, res) => {
  const { couponId } = req.params

  const updateCoupon = await CouponModel.findByIdAndUpdate(couponId, req.body, {
    new: true,
  })

  if (!updateCoupon) return res.status(500).json({ error: 'internet error' })

  res.status(200).json({ updateCoupon })
}

//* DELETE COUPON BY ID
module.exports.delete = async (req, res) => {
  const { couponId } = req.params

  if (!mongoose.isValidObjectId(req.params))
    return res.status(404).json({ error: 'coupon not found' })

  const delCoupon = await CouponModel.findByIdAndDelete(couponId)

  if (!delCoupon) return res.status(500).json({ error: 'internet error' })

  res.status(200).json({ deleted: 'true' })
}
