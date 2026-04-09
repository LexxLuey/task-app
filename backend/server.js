const express = require('express')
const pool = require('./db')
const app = express()
const port = 3000

app.use(express.json())

app.post('/tasks', async (req, res) => {
    try {
        const { title, description } = req.body;

        // Validation
        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Title is required' });
        }

        const result = await pool.query(
            'INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING *',
            [title.trim(), description || null]
        );

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const { limit = 10, offset = 0, completed } = req.query;

        let query = 'SELECT * FROM tasks';
        const params = [];

        // Optional filter by completion status
        if (completed !== undefined) {
            query += ' WHERE completed = $1';
            params.push(completed === 'true');
        }

        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Get total count for pagination
        const countResult = await pool.query('SELECT COUNT(*) FROM tasks');
        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total,
                hasMore: parseInt(offset) + result.rows.length < total
            }
        });

    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            success: true,
            task: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.patch('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;

        // Build dynamic update query
        let updateFields = [];
        let values = [];
        let counter = 1;

        if (title !== undefined) {
            updateFields.push(`title = $${counter++}`);
            values.push(title.trim());
        }
        if (description !== undefined) {
            updateFields.push(`description = $${counter++}`);
            values.push(description || null);
        }
        if (completed !== undefined) {
            updateFields.push(`completed = $${counter++}`);
            values.push(completed === true || completed === 'true');
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${counter} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            success: true,
            message: 'Task updated successfully',
            task: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({
            success: true,
            message: 'Task deleted successfully',
            deletedCount: result.rows.length,
            deletedTasks: result.rows
        });

    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
