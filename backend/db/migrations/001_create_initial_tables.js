/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('lawyer_inquiries', (table) => {
    table.text('id').primary();
    table.text('analysis_id').index();
    table.string('name', 255);
    table.string('email', 255);
    table.string('phone', 20);
    table.string('sector', 100);
    table.string('contact_preference', 50);
    table.text('additional_info');
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('feedback', (table) => {
    table.text('id').primary();
    table.text('analysis_id').index();
    table.integer('section_index');
    table.boolean('helpful');
    table.text('comment');
    table.datetime('created_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('feedback');
  await knex.schema.dropTableIfExists('lawyer_inquiries');
}
