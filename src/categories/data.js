"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// Imports
const database_1 = __importDefault(require("../database"));
const meta_1 = __importDefault(require("../meta"));
const plugins_1 = __importDefault(require("../plugins"));
const utils_1 = __importDefault(require("../utils"));
// Helper function to escape HTML characters
function escapeHtml(input) {
    return input.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Array of fields with integer values
const intFields = [
    'cid', 'parentCid', 'disabled', 'isSection', 'order',
    'topic_count', 'post_count', 'numRecentReplies',
    'minTags', 'maxTags', 'postQueue', 'subCategoriesPerPage',
];
module.exports = function (Categories) {
    Categories.getCategoriesFields = async function (cids, fields) {
        if (!Array.isArray(cids) || !cids.length) {
            return [];
        }
        const keys = cids.map(cid => `category:${cid}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const categories = await database_1.default.getObjects(keys, fields);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const result = await plugins_1.default.hooks.fire('filter:category.getFields', {
            cids: cids,
            categories: categories,
            fields: fields,
            keys: keys,
        });
        function defaultIntField(category, fields, fieldName, defaultField) {
            if (!fields.length || fields.includes(fieldName)) {
                const useDefault = !category.hasOwnProperty(fieldName) ||
                    category[fieldName] === null ||
                    category[fieldName] === '' ||
                    !utils_1.default.isNumber(category[fieldName]);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                category[fieldName] = useDefault ? meta_1.default.config[defaultField] : category[fieldName];
            }
        }
        function modifyCategory(category, fields) {
            if (!category) {
                return;
            }
            defaultIntField(category, fields, 'minTags', 'minimumTagsPerTopic');
            defaultIntField(category, fields, 'maxTags', 'maximumTagsPerTopic');
            defaultIntField(category, fields, 'postQueue', 'postQueue');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            database_1.default.parseIntFields(category, intFields, fields);
            const escapeFields = ['name', 'color', 'bgColor', 'backgroundImage', 'imageClass', 'class', 'link'];
            escapeFields.forEach((field) => {
                if (category.hasOwnProperty(field)) {
                    category[field] = escapeHtml(String(category[field] || ''));
                }
            });
            if (category.hasOwnProperty('icon')) {
                category.icon = category.icon || 'hidden';
            }
            if (category.hasOwnProperty('post_count')) {
                category.totalPostCount = category.post_count;
            }
            if (category.hasOwnProperty('topic_count')) {
                category.totalTopicCount = category.topic_count;
            }
            if (category.description) {
                category.description = escapeHtml(String(category.description));
                category.descriptionParsed = category.descriptionParsed || category.description;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const modifiedCategories = result.categories.map((category) => {
            modifyCategory(category, fields);
            return category;
        });
        return modifiedCategories;
    };
    // functions within the Category interface
    Categories.getCategoryData = async function (cid) {
        const categories = await Categories.getCategoriesFields([cid], []);
        return categories && categories.length ? categories[0] : null;
    };
    Categories.getCategoriesData = async function (cids) {
        return await Categories.getCategoriesFields(cids, []);
    };
    Categories.getCategoryField = async function (cid, field) {
        const category = await Categories.getCategoryFields(cid, [field]);
        return category ? category[field] : null;
    };
    Categories.getCategoryFields = async function (cid, fields) {
        const categories = await Categories.getCategoriesFields([cid], fields);
        return categories ? categories[0] : null;
    };
    Categories.getAllCategoryFields = async function (fields) {
        const cids = await Categories.getAllCidsFromSet('categories:cid');
        return await Categories.getCategoriesFields(cids, fields);
    };
    Categories.setCategoryField = async function (cid, field, value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await database_1.default.setObjectField(`category:${cid}`, field, value);
    };
    Categories.incrementCategoryFieldBy = async function (cid, field, value) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await database_1.default.incrObjectFieldBy(`category:${cid}`, field, value);
    };
};
