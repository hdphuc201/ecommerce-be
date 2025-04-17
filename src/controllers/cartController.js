import Cart from "~/models/cartModel";

// Lấy giỏ hàng của user (CHỈ TRẢ VỀ => DÙNG lean)
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req?.user?._id })
      .populate("listProduct")
      .lean(); // ✅ Thêm lean ở đây vì chỉ đọc

    if (!cart) {
      return res.status(401).json({
        message: "Giỏ hàng trống",
        cart: { listProduct: [], totalProduct: 0, subTotal: 0 },
      });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Thêm sản phẩm vào giỏ hàng (CÓ SAVE => KHÔNG dùng lean)
const addCart = async (req, res) => {
  try {
    const { productId, name, price, quantity, image, countInstock } = req.body;
    const userId = req.user?._id;

    // ❌ Không dùng lean vì cần sửa và save
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        listProduct: [],
        totalProduct: 0,
        subTotal: 0,
      });
    }

    const existingProduct = cart.listProduct.find(
      (item) => item.productId.toString() === productId
    );

    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.listProduct.push({
        productId,
        name,
        price,
        quantity,
        image,
        countInstock,
      });
    }

    cart.totalProduct = cart.listProduct.length;
    cart.subTotal += price * quantity;

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng (CÓ SAVE => KHÔNG dùng lean)
const updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart)
      return res.status(400).json({ message: "Giỏ hàng không tồn tại" });

    const productIndex = cart.listProduct.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (productIndex === -1)
      return res
        .status(400)
        .json({ message: "Sản phẩm không có trong giỏ hàng" });

    const product = cart.listProduct[productIndex];

    cart.subTotal += (quantity - product.quantity) * product.price;
    product.quantity = quantity;

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Xóa sản phẩm khỏi giỏ hàng (CÓ SAVE => KHÔNG dùng lean)
const removeCart = async (req, res) => {
  try {
    const { id } = req.query;

    let cart = await Cart.findOne({ userId: req.user?._id });

    if (!cart)
      return res.status(400).json({ message: "Giỏ hàng không tồn tại" });

    const isArray = Array.isArray(id) ? id : [id];

    for (const productId of isArray) {
      const productIndex = cart.listProduct.findIndex(
        (product) => product._id.toString() === productId
      );

      if (productIndex === -1) {
        return res
          .status(400)
          .json({ message: "Sản phẩm không có trong giỏ hàng" });
      }

      const removedProduct = cart.listProduct.splice(productIndex, 1)[0];

      cart.totalProduct -= removedProduct.quantity;
      cart.subTotal -= removedProduct.quantity * removedProduct.price;
    }

    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

export const cartController = {
  addCart,
  getCart,
  updateCart,
  removeCart,
};
