const { notStrictEqual } = require("assert");
const { response } = require("express");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyHasData(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName] !== "") {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function validDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes.length !== 0 && Array.isArray(dishes)) {
    return next();
  } else {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
}

function validQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish, index) => {
    const quantity = dish.quantity;
    if (!quantity || quantity < 1 || Number(quantity) !== quantity) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function list(req, res) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  } else {
    next({
      status: 404,
      message: `Order id not found: ${req.params.orderId}`,
    });
  }
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function orderMatches(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id === orderId) {
      return next();
    } else {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
    }
  } else {
    next();
  }
}

function statusCheck(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    !status ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery" &&
      status !== "delivered")
  ) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  next();
}

function update(req, res, next) {
  const foundOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;

  res.json({ data: foundOrder });
}

function destroy(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = res.locals.order;
  const deletedOrder = orders.findIndex(
    (order) => order.id === Number(orderId)
  );
  if (foundOrder.status === "pending") {
    orders.splice(deletedOrder, 1);
    res.sendStatus(204);
  } else {
    next({
      status: 400,
      message: `An order cannot be delete unless it is pending`,
    });
  }
}

module.exports = {
  create: [
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    validDishes,
    validQuantity,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    orderMatches,
    bodyHasData("deliverTo"),
    bodyHasData("mobileNumber"),
    bodyHasData("dishes"),
    bodyHasData("status"),
    statusCheck,
    validDishes,
    validQuantity,
    update,
  ],
  delete: [orderExists, destroy],
};
