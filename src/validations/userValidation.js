import { body, validationResult } from "express-validator";

export const validateRegisterUser = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("phone")
    .matches(/^\d{10}$/)
    .withMessage("Phone must be a 10-digit number"),
  body("password").notEmpty().withMessage("Password is required"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("ConfirmPassword do not match");
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
