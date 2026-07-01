module.exports = async (req, res) => {
    res.status(200).json({
        ok: true,
        mongo_url_set: Boolean(process.env.MONGO_URL),
        db_name: process.env.DB_NAME || '(varsayilan: it_helpdesk)',
        secret_key_set: Boolean(process.env.SECRET_KEY),
    });
};
