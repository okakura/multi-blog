pub struct FilteredQueryBuilder {
    base_query: String,
    where_clauses: Vec<String>,
    params: Vec<String>,
    param_count: usize,
}

impl FilteredQueryBuilder {
    pub fn new(base_query: impl Into<String>) -> Self {
        Self {
            base_query: base_query.into(),
            where_clauses: Vec::new(),
            params: Vec::new(),
            param_count: 0,
        }
    }

    pub fn add_filter_if_some<T>(&mut self, condition: &str, value: Option<T>) -> &mut Self
    where
        T: ToString,
    {
        if let Some(val) = value {
            self.param_count += 1;
            self.where_clauses
                .push(condition.replace("?", &format!("${}", self.param_count)));
            self.params.push(val.to_string());
        }
        self
    }

    pub fn add_search_filter(&mut self, fields: &[&str], search_term: Option<String>) -> &mut Self {
        if let Some(term) = search_term {
            let search_pattern = format!("%{term}%");
            self.param_count += 1;
            let conditions: Vec<String> = fields
                .iter()
                .map(|field| format!("{field} ILIKE ${}", self.param_count))
                .collect();
            self.where_clauses
                .push(format!("({})", conditions.join(" OR ")));
            self.params.push(search_pattern);
        }
        self
    }

    pub fn build(&self) -> (String, Vec<String>) {
        let mut query = self.base_query.clone();

        if !self.where_clauses.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&self.where_clauses.join(" AND "));
        }

        (query, self.params.clone())
    }

    pub fn build_with_pagination(&self, limit: i64, offset: i64) -> (String, Vec<String>) {
        let (mut query, mut params) = self.build();

        query.push_str(&format!(
            " LIMIT ${} OFFSET ${}",
            self.param_count + 1,
            self.param_count + 2
        ));

        params.push(limit.to_string());
        params.push(offset.to_string());

        (query, params)
    }
}

// Remove the trait and use a simpler approach
// We'll just implement it as simple functions instead of a trait
