"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Imports
// import * as validator from 'validator';
const db = __importStar(require("../database"));
const meta = __importStar(require("../meta"));
const plugins = __importStar(require("../plugins"));
const utils = __importStar(require("../utils"));
// Helper function to escape HTML characters
function escapeHtml(input) {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Array of fields with integer values
const intFields = [
    'cid', 'parentCid', 'disabled', 'isSection', 'order',
    'topic_count', 'post_count', 'numRecentReplies',
    'minTags', 'maxTags', 'postQueue', 'subCategoriesPerPage',
];
// Exported function that attaches methods to the Categories object
exports = function (Categories) {
    Categories.getCategoriesFields = function (cids, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(cids) || !cids.length) {
                return [];
            }
            const keys = cids.map(cid => `category:${cid}`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const categories = yield db.getObjects(keys, fields);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const result = yield plugins.hooks.fire('filter:category.getFields', {
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
                        !utils.isNumber(category[fieldName]);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                    category[fieldName] = useDefault ? meta.config[defaultField] : category[fieldName];
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
                db.parseIntFields(category, intFields, fields);
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
        });
    };
    Categories.getCategoryData = function (cid) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield Categories.getCategoriesFields([cid], []);
            return categories && categories.length ? categories[0] : null;
        });
    };
    Categories.getCategoriesData = function (cids) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Categories.getCategoriesFields(cids, []);
        });
    };
    Categories.getCategoryField = function (cid, field) {
        return __awaiter(this, void 0, void 0, function* () {
            const category = yield Categories.getCategoryFields(cid, [field]);
            return category ? category[field] : null;
        });
    };
    Categories.getCategoryFields = function (cid, fields) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield Categories.getCategoriesFields([cid], fields);
            return categories ? categories[0] : null;
        });
    };
    Categories.getAllCategoryFields = function (fields) {
        return __awaiter(this, void 0, void 0, function* () {
            const cids = yield Categories.getAllCidsFromSet('categories:cid');
            return yield Categories.getCategoriesFields(cids, fields);
        });
    };
    Categories.setCategoryField = function (cid, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield db.setObjectField(`category:${cid}`, field, value);
        });
    };
    Categories.incrementCategoryFieldBy = function (cid, field, value) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield db.incrObjectFieldBy(`category:${cid}`, field, value);
        });
    };
};
