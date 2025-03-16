const Category = require('../model/category');
const moment = require('moment');
const mongoose = require('mongoose')
const Product = require('../model/product')
const Offer = require('../model/offer')



const showAddCategory = async (req, res) => {
  try {
   
    const offers = await Offer.find({status:true, type: "category" });

    res.status(200).render("admin/add-category", { title:"Add Category",
      offers }); 
  } catch (error) {
    console.error("Error fetching offers:", error);
    res.status(500).send("Server error");
  }
};




const addCategory = async (req, res) => {
  try {
    const { name, description, offers } = req.body;
    const icon = req.file;
    if (!name || !description || !icon) {
      return res.status(400).json({ message: "All fields are required." });
    }

    let offerId = null;

   
    if (offers && offers !== "No Offer") {
      const offerExists = await Offer.findById(offers);
      if (!offerExists) {
        return res.status(400).json({ message: "Invalid offer selected." });
      }
      offerId = offerExists.name;
    }

    const category = new Category({
      name,
      description,
      offers: offerId,
      icon: icon.filename,
    });

    await category.save();

    res.status(200).json({ message: "Category added successfully!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};



const checkCategoryName = async (req, res) => {
    try {
      const { name } = req.query;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required.' });
      }
  
      const existingCategory = await Category.findOne({ name }).collation({ locale: 'en', strength: 2 });
      if (existingCategory) {
        return res.status(409).json({ success: false, message: 'Category name already exists.' });
      }
  
      return res.status(200).json({ success: true, message: 'Category name is available.' });
    } catch (error) {
      console.error('Error checking category name:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const showEditCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const category = await Category.findById(categoryId).populate("offers"); 
  
      if (!category) {
        return res.status(404).send("Category not found");
      }
  
      const offers = await Offer.find({ type: "category", status: true }); 
  
      res.status(200).render("admin/edit-category", {
        title:"Edit Category",
        category,
        offers,  
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  };
  

const editCategory = async (req, res) => {
  try {
    const { name, description, offers } = req.body;
    const icon = req.file ? req.file.filename : null;

    if (!name || !description) {
      return res.status(400).json({ message: "Name and description are required." });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    category.name = name;
    category.description = description;

    if (icon) {
      category.icon = icon;
    }

    
    if (offers && offers !== "No Offer") {
      const offerExists = await Offer.findById(offers);
      if (!offerExists) {
        return res.status(400).json({ message: "Invalid offer selected." });
      }
      category.offers = offerExists.name;
    } else {
      category.offers = null;  
    }

    await category.save();
    res.status(200).json({ message: "Category updated successfully.", category });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Failed to update category." });
  }
};

const showCategory = async (req, res) => {
  try {
      
      const categories = await Category.find({isDeleted:false}).sort({createdAt:-1});
       
       categories.forEach(category => {
          category.formattedDate = moment(category.createdAt).format('YYYY-MM-DD');  
      });
        
      res.status(200).render('admin/category',{title:"Category" ,  categories});
      
   
  } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).send('Server Error');
  }
 
};

const deleteCategory = async (req, res) => {
  try {
      const categoryId = req.params.id;
      await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
      
      
      res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
      console.error('Error while deleting category:', error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



module.exports = {
    showCategory,
    showAddCategory,
    addCategory,
    checkCategoryName,
    showEditCategory,
    editCategory,
    deleteCategory
};
