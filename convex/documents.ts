import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// CREATE
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    author: v.id("agents"),
    project: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const documentId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      author: args.author,
      project: args.project,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activities", {
      agent: args.author,
      action: "created_document",
      target: documentId,
      metadata: { title: args.title, project: args.project },
      createdAt: now,
    });

    return documentId;
  },
});

// READ - Get all documents
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("documents").order("desc").collect();
  },
});

// READ - Get document by ID
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// READ - Get documents by project
export const getByProject = query({
  args: { project: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("project", args.project))
      .order("desc")
      .collect();
  },
});

// READ - Get documents by author
export const getByAuthor = query({
  args: { author: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .withIndex("by_author", (q) => q.eq("author", args.author))
      .order("desc")
      .collect();
  },
});

// READ - Get documents with author details
export const listWithAuthors = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").order("desc").collect();

    const documentsWithAuthors = await Promise.all(
      documents.map(async (doc) => {
        const author = await ctx.db.get(doc.author);
        return {
          ...doc,
          author: author,
        };
      })
    );

    return documentsWithAuthors;
  },
});

// UPDATE
export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    project: v.optional(v.string()),
    updatedBy: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const { id, updatedBy, ...updates } = args;
    const now = Date.now();

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    // Log activity
    await ctx.db.insert("activities", {
      agent: updatedBy,
      action: "updated_document",
      target: id,
      metadata: updates,
      createdAt: now,
    });
  },
});

// DELETE
export const remove = mutation({
  args: {
    id: v.id("documents"),
    deletedBy: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);

    // Log activity before deletion
    await ctx.db.insert("activities", {
      agent: args.deletedBy,
      action: "deleted_document",
      target: args.id,
      metadata: doc ? { title: doc.title } : undefined,
      createdAt: Date.now(),
    });

    await ctx.db.delete(args.id);
  },
});
