# family-tree-print-backup

A tool to convert a GED file to a printable HTML designed for offline archiving of a family tree

## Overview

This is a tool which is designed to take a Family Tree GED file (for example, exported by Ancestry.com), and create a printable HTML file that has all the core data for the tree.

It isn't designed to show the tree in a diagram, rather it's designed so that the tree could be reconstructed easily whilst also documenting key details about each person.

The motivation for this is that a family tree is something that could be passed down generation to generation. Storing things digitally can so easily get lost, or file formats become hard to understand. By generating a printable document with all the key details, it allows a family tree to be backed up in a way that future generations could find it and reconstruct the tree.

The core concept is the individual. It will list all individuals in the tree, and all the basic information about the individual. It will also list all the families that this individual belongs to. Most ancestors will belong to at least 2 families: one where they are a child of the family, and one where they are a husband/wife/parent in the family.

There are 2 configurable options related to how it's displayed:

- `family-inline` (boolean, default false): when set to true, within the context of each individual, all the members of the family will be listed with the individual. This does make the document quite big, as all of this data will be repeated for each individual in the family. When set to false, each individual still lists which family they belong to.
- `family-section` (boolean, default true): when set to true, there will be a second section at the bottom that lists all the families. All families will have an identifier between them, so each family an individual belongs to can be found in this list. Having it as a separate section saves space as the members of each family will only be listed one time.

If both of these configurable options are set to `false`, then the details of each family won't be displayed in one place, and certain details (such as date and location of marriage) won't appear anywhere on the document. It would still be possible to find all the members of a family by looking over each individual.

There's an option called `name` which will be suffixed with `Family Tree`. A good option for the name is your last name.

## Usage

Step 1: Install all the packages with `npm install`.

Step 2: Compile with `npm run build`.

Step 3: Run with `npm run --name "Smith" /path/to/tree.ged`

Step 4: Find `output.html`, open it and (optionally) print it off
