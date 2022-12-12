const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyHasData(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (propertyName === "price") {
      Number(data.price);
      if (data.price === NaN) {
        return undefined;
      }
      if (data.price < 0) {
        return next({ status: 400, message: `Must include a ${propertyName}` });
      }
    }
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const id = nextId();
  const newDish = {
    id,
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${req.params.dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const dishId = req.params.dishId
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const foundDish = res.locals.dish;
  if (typeof price === 'string') {
    return next({
      status: 400,
      message: `${price} price is not a number`
    })
  } 
  if (id && dishId !== id) {
    return next({
      status: 400,
      message: `Id ${dishId} and id ${id} do not match`
    })
  }
  foundDish.name = name;
  foundDish.price = price;
  foundDish.description = description;
  foundDish.image_url = image_url;

  res.status(200).json({ data: foundDish });
}

module.exports = {
  list,
  create: [
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasData("name"),
    bodyHasData("description"),
    bodyHasData("price"),
    bodyHasData("image_url"),
    update,
  ],
};
