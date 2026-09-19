import Joi from "joi";
import { Review } from "../models/Review.js";

const objectId = Joi.string().hex().length(24);

const createSchema = Joi.object({
  courseCode: Joi.string().trim().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().allow("").optional(),
  reviewedBy: objectId.optional(),
});

const updateSchema = Joi.object({
  courseCode: Joi.string().trim(),
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string().trim().allow(""),
  reviewedBy: objectId,
}).min(1);

// GET /api/reviews
export async function getAllReviews(req, res, next) {
  try {
    const filter = req.query.courseCode ? { courseCode: req.query.courseCode } : {};
    const reviews = await Review.find(filter).populate('reviewedBy', 'name email');
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/:id
export async function getReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id).populate('reviewedBy', 'name email');
    if (!review) return res.status(404).json({ message: 'No Review Found Twin'})
    res.json(review);
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews/summary?courseCode=CS101
export async function getCourseSummary(req, res, next) {
  try {
    const { courseCode } = req.query;
    if(!courseCode) return res.status(400).json({ message: 'courseCode query parameter is required my broda' });

    const [result] = await Review.aggregate([
      { $match: {courseCode}},
      {
        $group: {
          _id: '$courseCode',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if(!result) return res.json({ courseCode, averageRating: 0, reviewCount: 0 });
    
    res.json({
      courseCode: result._id,
      averageRating: result.averageRating,
      reviewCount: result.reviewCount
    });

  } catch (err) {
    next(err);
  }
}

// POST /api/reviews
export async function createReview(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const review = await Review.create(value);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reviews/:id
export async function updateReview(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    
    const review = await Review.findByIdAdnUpdate(req.params.id, {$set: value}, {new: true, runValidators: true}).populate('reviewedBy', 'name email');
    if(!review) return res.status(404).json({ message: 'No Review Found Twin' });
    res.json(review);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/reviews/:id
export async function deleteReview(req, res, next) {
  try {
   const review = await Review.findByIdAndDelete(req.params.id);
   if(!review) return res.status(404).json({ message: 'No Review Found Twin' });
   res.json({ ok: true, message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
}
